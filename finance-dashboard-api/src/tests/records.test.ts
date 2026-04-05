import request from "supertest";
import app from "../app";
import { RecordModel } from "../modules/records/record.model";
import { authHeader, createTestRecord, createTestUser, loginAs } from "./helpers";

describe("Records module", () => {
    let adminToken: string;
    let viewerToken: string;
    let analystToken: string;
    let adminUserId: string;
    let seededRecords: Array<Awaited<ReturnType<typeof createTestRecord>>>;

    beforeEach(async () => {
        const admin = await createTestUser({
            name: "Admin User",
            email: "records.admin@example.com",
            role: "admin",
        });
        const viewer = await createTestUser({
            name: "Viewer User",
            email: "records.viewer@example.com",
            role: "viewer",
        });
        const analyst = await createTestUser({
            name: "Analyst User",
            email: "records.analyst@example.com",
            role: "analyst",
        });

        adminUserId = admin._id.toString();
        adminToken = (await loginAs(app, admin.email, "password123")).token;
        viewerToken = (await loginAs(app, viewer.email, "password123")).token;
        analystToken = (await loginAs(app, analyst.email, "password123")).token;
    });

    describe("POST /api/records", () => {
        it("allows an admin to create a record successfully", async () => {
            const response = await request(app)
                .post("/api/records")
                .set(authHeader(adminToken))
                .send({
                    amount: 2500,
                    type: "income",
                    category: "Salary",
                    date: "2024-01-15",
                    notes: "January salary",
                });

            expect(response.status).toBe(201);
            expect(response.body.record.amount).toBe(2500);
            expect(response.body.record.type).toBe("income");
            expect(response.body.record.isDeleted).toBe(false);
        });

        it("prevents a viewer from creating a record", async () => {
            const response = await request(app)
                .post("/api/records")
                .set(authHeader(viewerToken))
                .send({
                    amount: 2500,
                    type: "income",
                    category: "Salary",
                    date: "2024-01-15",
                });

            expect(response.status).toBe(403);
        });

        it("prevents an analyst from creating a record", async () => {
            const response = await request(app)
                .post("/api/records")
                .set(authHeader(analystToken))
                .send({
                    amount: 2500,
                    type: "income",
                    category: "Salary",
                    date: "2024-01-15",
                });

            expect(response.status).toBe(403);
        });

        it("fails when the amount is negative", async () => {
            const response = await request(app)
                .post("/api/records")
                .set(authHeader(adminToken))
                .send({
                    amount: -500,
                    type: "income",
                    category: "Salary",
                    date: "2024-01-15",
                });

            expect(response.status).toBe(422);
        });

        it("fails when the amount is zero", async () => {
            const response = await request(app)
                .post("/api/records")
                .set(authHeader(adminToken))
                .send({
                    amount: 0,
                    type: "income",
                    category: "Salary",
                    date: "2024-01-15",
                });

            expect(response.status).toBe(422);
        });

        it("fails when the type is invalid", async () => {
            const response = await request(app)
                .post("/api/records")
                .set(authHeader(adminToken))
                .send({
                    amount: 500,
                    type: "transfer",
                    category: "Salary",
                    date: "2024-01-15",
                });

            expect(response.status).toBe(422);
        });

        it("fails when the date is missing", async () => {
            const response = await request(app)
                .post("/api/records")
                .set(authHeader(adminToken))
                .send({
                    amount: 500,
                    type: "income",
                    category: "Salary",
                });

            expect(response.status).toBe(422);
        });

        it("fails when the date format is invalid", async () => {
            const response = await request(app)
                .post("/api/records")
                .set(authHeader(adminToken))
                .send({
                    amount: 500,
                    type: "income",
                    category: "Salary",
                    date: "15-01-2024",
                });

            expect(response.status).toBe(422);
        });

        it("fails when the category is an empty string", async () => {
            const response = await request(app)
                .post("/api/records")
                .set(authHeader(adminToken))
                .send({
                    amount: 500,
                    type: "income",
                    category: "",
                    date: "2024-01-15",
                });

            expect(response.status).toBe(422);
        });

        it("creates a record when notes is omitted", async () => {
            const response = await request(app)
                .post("/api/records")
                .set(authHeader(adminToken))
                .send({
                    amount: 750,
                    type: "income",
                    category: "Bonus",
                    date: "2024-02-01",
                });

            expect(response.status).toBe(201);
            expect(response.body.record.notes).toBeUndefined();
        });
    });

    describe("GET /api/records", () => {
        beforeEach(async () => {
            seededRecords = [
                await createTestRecord(
                    { amount: 10000, type: "income", category: "Salary", date: "2024-01-10" },
                    adminUserId
                ),
                await createTestRecord(
                    { amount: 5000, type: "income", category: "Freelance", date: "2024-02-15" },
                    adminUserId
                ),
                await createTestRecord(
                    { amount: 3000, type: "expense", category: "Rent", date: "2024-03-05" },
                    adminUserId
                ),
                await createTestRecord(
                    { amount: 1000, type: "expense", category: "Food", date: "2024-04-12" },
                    adminUserId
                ),
                await createTestRecord(
                    { amount: 500, type: "expense", category: "Transport", date: "2024-06-01" },
                    adminUserId
                ),
            ];
        });

        it("returns paginated records for a viewer", async () => {
            const response = await request(app)
                .get("/api/records")
                .set(authHeader(viewerToken));

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.total).toBe(5);
            expect(response.body.page).toBe(1);
            expect(response.body.limit).toBe(20);
        });

        it("filters records by income type", async () => {
            const response = await request(app)
                .get("/api/records?type=income")
                .set(authHeader(viewerToken));

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(2);
        });

        it("filters records by expense type", async () => {
            const response = await request(app)
                .get("/api/records?type=expense")
                .set(authHeader(viewerToken));

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(3);
        });

        it("filters records by category", async () => {
            const response = await request(app)
                .get("/api/records?category=Salary")
                .set(authHeader(viewerToken));

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
        });

        it("filters records by date range", async () => {
            const response = await request(app)
                .get("/api/records?from=2024-01-01&to=2024-03-31")
                .set(authHeader(viewerToken));

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(3);
            response.body.data.forEach((record: { date: string }) => {
                expect(record.date >= "2024-01-01").toBe(true);
                expect(record.date <= "2024-03-31").toBe(true);
            });
        });

        it("paginates records correctly", async () => {
            const response = await request(app)
                .get("/api/records?page=1&limit=2")
                .set(authHeader(viewerToken));

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.total).toBe(5);
        });

        it("returns page 2 results with limit 2", async () => {
            const response = await request(app)
                .get("/api/records?page=2&limit=2")
                .set(authHeader(viewerToken));

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(2);
        });

        it("excludes soft deleted records from the list", async () => {
            await RecordModel.findByIdAndUpdate(seededRecords[0]._id, { isDeleted: true });

            const response = await request(app)
                .get("/api/records")
                .set(authHeader(viewerToken));

            expect(response.status).toBe(200);
            expect(response.body.total).toBe(4);
        });

        it("combines type and category filters", async () => {
            const response = await request(app)
                .get("/api/records?type=income&category=Salary")
                .set(authHeader(viewerToken));

            expect(response.status).toBe(200);
            expect(response.body.total).toBe(1);
        });
    });

    describe("GET /api/records/:id", () => {
        let recordId: string;

        beforeEach(async () => {
            const record = await createTestRecord(
                { amount: 4200, type: "income", category: "Salary", date: "2024-01-20" },
                adminUserId
            );
            recordId = record._id.toString();
        });

        it("returns a record by a valid id", async () => {
            const response = await request(app)
                .get(`/api/records/${recordId}`)
                .set(authHeader(viewerToken));

            expect(response.status).toBe(200);
            expect(response.body.record.id).toBe(recordId);
            expect(response.body.record.amount).toBe(4200);
        });

        it("returns 404 for a non-existent id", async () => {
            const response = await request(app)
                .get("/api/records/000000000000000000000000")
                .set(authHeader(viewerToken));

            expect(response.status).toBe(404);
        });

        it("returns 404 for a soft deleted record", async () => {
            await RecordModel.findByIdAndUpdate(recordId, { isDeleted: true });

            const response = await request(app)
                .get(`/api/records/${recordId}`)
                .set(authHeader(viewerToken));

            expect(response.status).toBe(404);
        });
    });

    describe("PATCH /api/records/:id", () => {
        let recordId: string;

        beforeEach(async () => {
            const record = await createTestRecord(
                { amount: 4200, type: "income", category: "Salary", date: "2024-01-20" },
                adminUserId
            );
            recordId = record._id.toString();
        });

        it("updates a record for an admin", async () => {
            const response = await request(app)
                .patch(`/api/records/${recordId}`)
                .set(authHeader(adminToken))
                .send({ amount: 9999, notes: "updated" });

            expect(response.status).toBe(200);
            expect(response.body.record.amount).toBe(9999);
            expect(response.body.record.notes).toBe("updated");
        });

        it("prevents a viewer from updating a record", async () => {
            const response = await request(app)
                .patch(`/api/records/${recordId}`)
                .set(authHeader(viewerToken))
                .send({ amount: 9999 });

            expect(response.status).toBe(403);
        });

        it("prevents an analyst from updating a record", async () => {
            const response = await request(app)
                .patch(`/api/records/${recordId}`)
                .set(authHeader(analystToken))
                .send({ amount: 9999 });

            expect(response.status).toBe(403);
        });

        it("returns 404 for a non-existent record", async () => {
            const response = await request(app)
                .patch("/api/records/000000000000000000000000")
                .set(authHeader(adminToken))
                .send({ amount: 9999 });

            expect(response.status).toBe(404);
        });
    });

    describe("DELETE /api/records/:id", () => {
        let recordId: string;

        beforeEach(async () => {
            const record = await createTestRecord(
                { amount: 4200, type: "income", category: "Salary", date: "2024-01-20" },
                adminUserId
            );
            recordId = record._id.toString();
        });

        it("soft deletes a record for an admin", async () => {
            const response = await request(app)
                .delete(`/api/records/${recordId}`)
                .set(authHeader(adminToken));

            expect(response.status).toBe(200);

            const deletedRecord = await RecordModel.findById(recordId).lean();
            expect(deletedRecord?.isDeleted).toBe(true);

            const listResponse = await request(app)
                .get("/api/records")
                .set(authHeader(viewerToken));

            expect(listResponse.body.total).toBe(0);
        });

        it("prevents a viewer from deleting a record", async () => {
            const response = await request(app)
                .delete(`/api/records/${recordId}`)
                .set(authHeader(viewerToken));

            expect(response.status).toBe(403);
        });

        it("prevents an analyst from deleting a record", async () => {
            const response = await request(app)
                .delete(`/api/records/${recordId}`)
                .set(authHeader(analystToken));

            expect(response.status).toBe(403);
        });

        it("returns 404 when deleting an already deleted record", async () => {
            await request(app).delete(`/api/records/${recordId}`).set(authHeader(adminToken));

            const response = await request(app)
                .delete(`/api/records/${recordId}`)
                .set(authHeader(adminToken));

            expect(response.status).toBe(404);
        });
    });
});
