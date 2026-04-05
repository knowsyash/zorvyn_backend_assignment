import request from "supertest";
import { signAccessToken } from "../utils/jwt";
import app from "../app";
import { authHeader, createTestUser, loginAs } from "./helpers";

describe("Authentication and authorization middleware", () => {
    describe("authenticate middleware", () => {
        it("rejects a request with no token", async () => {
            const response = await request(app).get("/api/records");

            expect(response.status).toBe(401);
        });

        it("rejects a request with wrong authorization format", async () => {
            const response = await request(app)
                .get("/api/records")
                .set("Authorization", "Token abc123");

            expect(response.status).toBe(401);
        });

        it("rejects a request with a malformed token", async () => {
            const response = await request(app)
                .get("/api/records")
                .set(authHeader("invalidtoken123"));

            expect(response.status).toBe(401);
        });

        it("rejects a request with an expired token", async () => {
            const user = await createTestUser({
                email: "expired.token@example.com",
                role: "viewer",
            });
            const token = signAccessToken(
                { id: user._id.toString(), email: user.email, role: user.role },
                "1ms"
            );

            await new Promise((resolve) => setTimeout(resolve, 5));

            const response = await request(app)
                .get("/api/records")
                .set(authHeader(token));

            expect(response.status).toBe(401);
        });

        it("allows a request with a valid token", async () => {
            const user = await createTestUser({
                email: "valid.token@example.com",
                role: "viewer",
            });
            const { token } = await loginAs(app, user.email, "password123");

            const response = await request(app)
                .get("/api/records")
                .set(authHeader(token));

            expect(response.status).toBe(200);
        });
    });

    describe("authorize middleware", () => {
        it("prevents a viewer from creating records", async () => {
            const viewer = await createTestUser({
                email: "viewer.blocked@example.com",
                role: "viewer",
            });
            const { token } = await loginAs(app, viewer.email, "password123");

            const response = await request(app)
                .post("/api/records")
                .set(authHeader(token))
                .send({
                    amount: 100,
                    type: "income",
                    category: "Salary",
                    date: "2024-01-01",
                });

            expect(response.status).toBe(403);
        });

        it("allows an admin to create records", async () => {
            const admin = await createTestUser({
                email: "admin.allowed@example.com",
                role: "admin",
            });
            const { token } = await loginAs(app, admin.email, "password123");

            const response = await request(app)
                .post("/api/records")
                .set(authHeader(token))
                .send({
                    amount: 100,
                    type: "income",
                    category: "Salary",
                    date: "2024-01-01",
                });

            expect(response.status).toBe(201);
        });

        it("prevents a viewer from accessing the dashboard summary", async () => {
            const viewer = await createTestUser({
                email: "viewer.summary@example.com",
                role: "viewer",
            });
            const { token } = await loginAs(app, viewer.email, "password123");

            const response = await request(app)
                .get("/api/dashboard/summary")
                .set(authHeader(token));

            expect(response.status).toBe(403);
        });

        it("allows an analyst to access the dashboard summary", async () => {
            const analyst = await createTestUser({
                email: "analyst.summary@example.com",
                role: "analyst",
            });
            const { token } = await loginAs(app, analyst.email, "password123");

            const response = await request(app)
                .get("/api/dashboard/summary")
                .set(authHeader(token));

            expect(response.status).toBe(200);
        });

        it("prevents a viewer from accessing the users endpoint", async () => {
            const viewer = await createTestUser({
                email: "viewer.users@example.com",
                role: "viewer",
            });
            const { token } = await loginAs(app, viewer.email, "password123");

            const response = await request(app)
                .get("/api/users")
                .set(authHeader(token));

            expect(response.status).toBe(403);
        });

        it("prevents an analyst from accessing the users endpoint", async () => {
            const analyst = await createTestUser({
                email: "analyst.users@example.com",
                role: "analyst",
            });
            const { token } = await loginAs(app, analyst.email, "password123");

            const response = await request(app)
                .get("/api/users")
                .set(authHeader(token));

            expect(response.status).toBe(403);
        });

        it("allows only an admin to access the users endpoint", async () => {
            const admin = await createTestUser({
                email: "admin.users@example.com",
                role: "admin",
            });
            const { token } = await loginAs(app, admin.email, "password123");

            const response = await request(app)
                .get("/api/users")
                .set(authHeader(token));

            expect(response.status).toBe(200);
        });
    });
});
