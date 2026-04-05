import request from "supertest";
import app from "../app";
import { RecordModel } from "../modules/records/record.model";
import { authHeader, createTestRecord, createTestUser, loginAs } from "./helpers";

describe("Dashboard module", () => {
    let adminToken: string;
    let analystToken: string;
    let viewerToken: string;
    let adminUserId: string;
    let seededRecords: Array<Awaited<ReturnType<typeof createTestRecord>>>;

    beforeEach(async () => {
        const admin = await createTestUser({
            name: "Dashboard Admin",
            email: "dashboard.admin@example.com",
            role: "admin",
        });
        const analyst = await createTestUser({
            name: "Dashboard Analyst",
            email: "dashboard.analyst@example.com",
            role: "analyst",
        });
        const viewer = await createTestUser({
            name: "Dashboard Viewer",
            email: "dashboard.viewer@example.com",
            role: "viewer",
        });

        adminUserId = admin._id.toString();
        adminToken = (await loginAs(app, admin.email, "password123")).token;
        analystToken = (await loginAs(app, analyst.email, "password123")).token;
        viewerToken = (await loginAs(app, viewer.email, "password123")).token;

        seededRecords = [
            await createTestRecord(
                { amount: 10000, type: "income", category: "Salary", date: "2024-01-10" },
                adminUserId
            ),
            await createTestRecord(
                { amount: 5000, type: "income", category: "Freelance", date: "2024-02-10" },
                adminUserId
            ),
            await createTestRecord(
                { amount: 3000, type: "expense", category: "Rent", date: "2024-01-15" },
                adminUserId
            ),
            await createTestRecord(
                { amount: 1000, type: "expense", category: "Food", date: "2024-02-15" },
                adminUserId
            ),
            await createTestRecord(
                { amount: 500, type: "expense", category: "Transport", date: "2024-01-20" },
                adminUserId
            ),
        ];
    });

    describe("GET /api/dashboard/summary", () => {
        it("returns the correct summary for an analyst", async () => {
            const response = await request(app)
                .get("/api/dashboard/summary")
                .set(authHeader(analystToken));

            expect(response.status).toBe(200);
            expect(response.body.totalIncome).toBe(15000);
            expect(response.body.totalExpenses).toBe(4500);
            expect(response.body.netBalance).toBe(10500);
            expect(response.body.totalRecords).toBe(5);
        });

        it("returns the correct summary for an admin", async () => {
            const response = await request(app)
                .get("/api/dashboard/summary")
                .set(authHeader(adminToken));

            expect(response.status).toBe(200);
            expect(response.body.totalIncome).toBe(15000);
            expect(response.body.totalExpenses).toBe(4500);
            expect(response.body.netBalance).toBe(10500);
            expect(response.body.totalRecords).toBe(5);
        });

        it("prevents a viewer from accessing the summary", async () => {
            const response = await request(app)
                .get("/api/dashboard/summary")
                .set(authHeader(viewerToken));

            expect(response.status).toBe(403);
        });

        it("excludes soft deleted records from the summary", async () => {
            await RecordModel.findByIdAndUpdate(seededRecords[0]._id, { isDeleted: true });

            const response = await request(app)
                .get("/api/dashboard/summary")
                .set(authHeader(analystToken));

            expect(response.status).toBe(200);
            expect(response.body.totalIncome).toBe(5000);
            expect(response.body.totalRecords).toBe(4);
        });

        it("returns zero values when no records exist", async () => {
            await RecordModel.deleteMany({});

            const response = await request(app)
                .get("/api/dashboard/summary")
                .set(authHeader(analystToken));

            expect(response.status).toBe(200);
            expect(response.body.totalIncome).toBe(0);
            expect(response.body.totalExpenses).toBe(0);
            expect(response.body.netBalance).toBe(0);
            expect(response.body.totalRecords).toBe(0);
        });
    });

    describe("GET /api/dashboard/categories", () => {
        it("returns the correct category breakdown", async () => {
            const response = await request(app)
                .get("/api/dashboard/categories")
                .set(authHeader(analystToken));

            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ category: "Salary", type: "income", total: 10000 }),
                    expect.objectContaining({ category: "Freelance", type: "income", total: 5000 }),
                    expect.objectContaining({ category: "Rent", type: "expense", total: 3000 }),
                    expect.objectContaining({ category: "Food", type: "expense", total: 1000 }),
                    expect.objectContaining({ category: "Transport", type: "expense", total: 500 }),
                ])
            );
        });

        it("prevents a viewer from accessing category breakdown", async () => {
            const response = await request(app)
                .get("/api/dashboard/categories")
                .set(authHeader(viewerToken));

            expect(response.status).toBe(403);
        });

        it("returns an empty array when no records exist", async () => {
            await RecordModel.deleteMany({});

            const response = await request(app)
                .get("/api/dashboard/categories")
                .set(authHeader(analystToken));

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });
    });

    describe("GET /api/dashboard/recent", () => {
        it("returns the last 10 records by default", async () => {
            const response = await request(app)
                .get("/api/dashboard/recent")
                .set(authHeader(analystToken));

            expect(response.status).toBe(200);
            expect(response.body.length).toBeLessThanOrEqual(10);

            for (let index = 1; index < response.body.length; index += 1) {
                const previous = new Date(response.body[index - 1].createdAt).getTime();
                const current = new Date(response.body[index].createdAt).getTime();
                expect(previous).toBeGreaterThanOrEqual(current);
            }
        });

        it("respects the limit query param", async () => {
            const response = await request(app)
                .get("/api/dashboard/recent?limit=3")
                .set(authHeader(analystToken));

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(3);
        });

        it("includes a createdByName field on each recent record", async () => {
            const response = await request(app)
                .get("/api/dashboard/recent?limit=5")
                .set(authHeader(analystToken));

            expect(response.status).toBe(200);
            response.body.forEach((record: { createdByName: string }) => {
                expect(record.createdByName).toEqual(expect.any(String));
                expect(record.createdByName.length).toBeGreaterThan(0);
            });
        });

        it("prevents a viewer from accessing recent activity", async () => {
            const response = await request(app)
                .get("/api/dashboard/recent")
                .set(authHeader(viewerToken));

            expect(response.status).toBe(403);
        });

        it("uses default limit of 10 when limit is not provided", async () => {
            for (let index = 0; index < 15; index += 1) {
                await createTestRecord(
                    {
                        amount: 100 + index,
                        type: "income",
                        category: `Extra ${index}`,
                        date: "2024-03-01",
                    },
                    adminUserId
                );
            }

            const response = await request(app)
                .get("/api/dashboard/recent")
                .set(authHeader(analystToken));

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(10);
        });
    });

    describe("GET /api/dashboard/trends", () => {
        it("returns monthly trends for 2024", async () => {
            const response = await request(app)
                .get("/api/dashboard/trends?year=2024")
                .set(authHeader(analystToken));

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(12);
            expect(response.body[0]).toEqual({ month: 1, income: 10000, expenses: 3500 });
            expect(response.body[1]).toEqual({ month: 2, income: 5000, expenses: 1000 });
            expect(response.body[2]).toEqual({ month: 3, income: 0, expenses: 0 });
        });

        it("returns all 12 months even when some have no records", async () => {
            const response = await request(app)
                .get("/api/dashboard/trends?year=2024")
                .set(authHeader(analystToken));

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(12);
        });

        it("prevents a viewer from accessing trends", async () => {
            const response = await request(app)
                .get("/api/dashboard/trends?year=2024")
                .set(authHeader(viewerToken));

            expect(response.status).toBe(403);
        });

        it("returns trends with default year when year is omitted", async () => {
            const response = await request(app)
                .get("/api/dashboard/trends")
                .set(authHeader(analystToken));

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(12);
        });
    });
});
