import request from "supertest";
import app from "../app";
import { RecordModel } from "../modules/records/record.model";
import { authHeader, createTestRecord, createTestUser, loginAs } from "./helpers";

describe("Integration and edge cases", () => {
    let adminToken: string;
    let adminUserId: string;

    beforeEach(async () => {
        const admin = await createTestUser({
            name: "Integration Admin",
            email: "integration.admin@example.com",
            role: "admin",
        });

        adminUserId = admin._id.toString();
        adminToken = (await loginAs(app, admin.email, "password123")).token;
    });

    describe("Full user lifecycle", () => {
        it("supports full analyst read-only workflow", async () => {
            const analyst = await createTestUser({
                name: "Integration Analyst",
                email: "integration.analyst@example.com",
                role: "analyst",
            });
            const analystLogin = await loginAs(app, analyst.email, "password123");

            const createOne = await request(app)
                .post("/api/records")
                .set(authHeader(adminToken))
                .send({ amount: 1000, type: "income", category: "Salary", date: "2024-01-01" });
            const createTwo = await request(app)
                .post("/api/records")
                .set(authHeader(adminToken))
                .send({ amount: 2000, type: "income", category: "Bonus", date: "2024-01-02" });
            const createThree = await request(app)
                .post("/api/records")
                .set(authHeader(adminToken))
                .send({ amount: 500, type: "expense", category: "Food", date: "2024-01-03" });

            expect(createOne.status).toBe(201);
            expect(createTwo.status).toBe(201);
            expect(createThree.status).toBe(201);

            const listResponse = await request(app)
                .get("/api/records")
                .set(authHeader(analystLogin.token));
            expect(listResponse.status).toBe(200);
            expect(listResponse.body.total).toBe(3);

            expect(
                (await request(app)
                    .get("/api/dashboard/summary")
                    .set(authHeader(analystLogin.token))).status
            ).toBe(200);
            expect(
                (await request(app)
                    .get("/api/dashboard/categories")
                    .set(authHeader(analystLogin.token))).status
            ).toBe(200);

            expect(
                (await request(app)
                    .post("/api/records")
                    .set(authHeader(analystLogin.token))
                    .send({ amount: 10, type: "income", category: "X", date: "2024-01-01" })).status
            ).toBe(403);
            expect(
                (await request(app)
                    .patch(`/api/records/${createOne.body.record.id}`)
                    .set(authHeader(analystLogin.token))
                    .send({ amount: 123 })).status
            ).toBe(403);
            expect(
                (await request(app)
                    .delete(`/api/records/${createOne.body.record.id}`)
                    .set(authHeader(analystLogin.token))).status
            ).toBe(403);
            expect(
                (await request(app)
                    .get("/api/users")
                    .set(authHeader(analystLogin.token))).status
            ).toBe(403);
        });

        it("supports the flow from registration to login to protected API access", async () => {
            const registerResponse = await request(app).post("/api/auth/register").send({
                name: "Lifecycle Analyst",
                email: "lifecycle.analyst@example.com",
                password: "password123",
                role: "analyst",
            });

            expect(registerResponse.status).toBe(201);

            const loginResponse = await request(app).post("/api/auth/login").send({
                email: "lifecycle.analyst@example.com",
                password: "password123",
            });

            expect(loginResponse.status).toBe(200);
            const token = loginResponse.body.data.token as string;

            expect((await request(app).get("/api/records").set(authHeader(token))).status).toBe(200);
            expect((await request(app).get("/api/dashboard/summary").set(authHeader(token))).status).toBe(200);
            expect(
                (await request(app)
                    .post("/api/records")
                    .set(authHeader(token))
                    .send({ amount: 100, type: "income", category: "Salary", date: "2024-01-01" }))
                    .status
            ).toBe(403);
            expect((await request(app).get("/api/users").set(authHeader(token))).status).toBe(403);
        });

        it("supports the full admin workflow", async () => {
            const createdRecords = [] as Array<{ id: string }>;

            createdRecords.push(
                (await request(app)
                    .post("/api/records")
                    .set(authHeader(adminToken))
                    .send({ amount: 1000, type: "income", category: "Salary", date: "2024-01-01" }))
                    .body.record
            );
            createdRecords.push(
                (await request(app)
                    .post("/api/records")
                    .set(authHeader(adminToken))
                    .send({ amount: 2000, type: "income", category: "Bonus", date: "2024-01-05" }))
                    .body.record
            );
            createdRecords.push(
                (await request(app)
                    .post("/api/records")
                    .set(authHeader(adminToken))
                    .send({ amount: 500, type: "expense", category: "Food", date: "2024-01-10" }))
                    .body.record
            );

            const listResponse = await request(app)
                .get("/api/records")
                .set(authHeader(adminToken));

            expect(listResponse.body.total).toBe(3);

            const updateResponse = await request(app)
                .patch(`/api/records/${createdRecords[0].id}`)
                .set(authHeader(adminToken))
                .send({ amount: 1500 });

            expect(updateResponse.status).toBe(200);
            expect(updateResponse.body.record.amount).toBe(1500);

            const getUpdatedResponse = await request(app)
                .get(`/api/records/${createdRecords[0].id}`)
                .set(authHeader(adminToken));

            expect(getUpdatedResponse.body.record.amount).toBe(1500);

            const deleteResponse = await request(app)
                .delete(`/api/records/${createdRecords[2].id}`)
                .set(authHeader(adminToken));

            expect(deleteResponse.status).toBe(200);

            const afterDeleteResponse = await request(app)
                .get("/api/records")
                .set(authHeader(adminToken));

            expect(afterDeleteResponse.body.total).toBe(2);

            const summaryResponse = await request(app)
                .get("/api/dashboard/summary")
                .set(authHeader(adminToken));

            expect(summaryResponse.body.totalIncome).toBe(3500);
            expect(summaryResponse.body.totalExpenses).toBe(0);
            expect(summaryResponse.body.totalRecords).toBe(2);
            expect(summaryResponse.body.netBalance).toBe(3500);
        });

        it("prevents a deactivated user from logging in", async () => {
            const user = await createTestUser({
                email: "inactive.workflow@example.com",
                role: "viewer",
            });

            await request(app)
                .patch(`/api/users/${user._id}/deactivate`)
                .set(authHeader(adminToken));

            const loginResponse = await request(app).post("/api/auth/login").send({
                email: user.email,
                password: "password123",
            });

            expect(loginResponse.status).toBe(401);
        });
    });

    describe("Data integrity", () => {
        it("keeps deleted records out of dashboard numbers", async () => {
            const income = await createTestRecord(
                { amount: 5000, type: "income", category: "Salary", date: "2024-01-01" },
                adminUserId
            );
            const expense = await createTestRecord(
                { amount: 2000, type: "expense", category: "Rent", date: "2024-01-02" },
                adminUserId
            );

            let summaryResponse = await request(app)
                .get("/api/dashboard/summary")
                .set(authHeader(adminToken));

            expect(summaryResponse.body.totalIncome).toBe(5000);
            expect(summaryResponse.body.totalExpenses).toBe(2000);
            expect(summaryResponse.body.netBalance).toBe(3000);

            await RecordModel.findByIdAndUpdate(income._id, { isDeleted: true });

            summaryResponse = await request(app)
                .get("/api/dashboard/summary")
                .set(authHeader(adminToken));

            expect(summaryResponse.body.totalIncome).toBe(0);
            expect(summaryResponse.body.totalExpenses).toBe(2000);
            expect(summaryResponse.body.netBalance).toBe(-2000);
        });

        it("keeps dashboard totals correct during concurrent record creation", async () => {
            await Promise.all(
                Array.from({ length: 10 }, (_, index) =>
                    request(app)
                        .post("/api/records")
                        .set(authHeader(adminToken))
                        .send({
                            amount: index + 1,
                            type: "income",
                            category: `Category ${index + 1}`,
                            date: `2024-01-${String(index + 1).padStart(2, "0")}`,
                        })
                )
            );

            const summaryResponse = await request(app)
                .get("/api/dashboard/summary")
                .set(authHeader(adminToken));

            expect(summaryResponse.body.totalRecords).toBe(10);
        });

        it("keeps total count unaffected by pagination options", async () => {
            await Promise.all(
                Array.from({ length: 10 }, (_, index) =>
                    request(app)
                        .post("/api/records")
                        .set(authHeader(adminToken))
                        .send({
                            amount: index + 1,
                            type: "income",
                            category: `Paged ${index + 1}`,
                            date: `2024-02-${String(index + 1).padStart(2, "0")}`,
                        })
                )
            );

            const firstPage = await request(app)
                .get("/api/records?page=1&limit=3")
                .set(authHeader(adminToken));
            const secondPage = await request(app)
                .get("/api/records?page=2&limit=3")
                .set(authHeader(adminToken));

            expect(firstPage.status).toBe(200);
            expect(secondPage.status).toBe(200);
            expect(firstPage.body.total).toBe(10);
            expect(secondPage.body.total).toBe(10);
        });
    });

    describe("Health check", () => {
        it("returns ok at /api/health without auth", async () => {
            const response = await request(app).get("/api/health");

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ status: "ok" });
        });

        it("returns 404 for unknown routes", async () => {
            const response = await request(app).get("/api/this-does-not-exist");

            expect(response.status).toBe(404);
        });
    });
});
