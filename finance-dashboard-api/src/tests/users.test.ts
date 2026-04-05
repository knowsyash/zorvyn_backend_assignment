import request from "supertest";
import app from "../app";
import { UserModel } from "../modules/auth/user.model";
import { authHeader, createTestUser, loginAs } from "./helpers";

describe("Users module", () => {
    let adminToken: string;

    beforeEach(async () => {
        const admin = await createTestUser({
            name: "Admin User",
            email: "admin@example.com",
            role: "admin",
        });
        adminToken = (await loginAs(app, admin.email, "password123")).token;
    });

    describe("POST /api/users/demo/seed", () => {
        it("refreshes demo users and demo records for an admin", async () => {
            await createTestUser({
                name: "Temporary User",
                email: "temporary.user@example.com",
                role: "viewer",
            });

            const response = await request(app)
                .post("/api/users/demo/seed")
                .set(authHeader(adminToken));

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Demo data seeded successfully");

            const usersResponse = await request(app)
                .get("/api/users")
                .set(authHeader(adminToken));

            expect(usersResponse.status).toBe(200);
            expect(usersResponse.body.users).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ email: "admin@finance.com", role: "admin" }),
                    expect.objectContaining({ email: "analyst@finance.com", role: "analyst" }),
                    expect.objectContaining({ email: "viewer@finance.com", role: "viewer" }),
                ])
            );
            expect(
                usersResponse.body.users.some(
                    (user: { email: string }) => user.email === "temporary.user@example.com"
                )
            ).toBe(true);

            const demoAdminLogin = await request(app).post("/api/auth/login").send({
                email: "admin@finance.com",
                password: "admin123",
            });

            expect(demoAdminLogin.status).toBe(200);
            expect(demoAdminLogin.body.data.user.role).toBe("admin");

            const recordsResponse = await request(app)
                .get("/api/records")
                .set(authHeader(demoAdminLogin.body.data.token));

            expect(recordsResponse.status).toBe(200);
            expect(recordsResponse.body.total).toBe(6);
        });
    });

    describe("GET /api/users", () => {
        it("returns all users for an admin and excludes passwords", async () => {
            await createTestUser({ email: "user1@example.com" });
            await createTestUser({ email: "user2@example.com" });
            await createTestUser({ email: "user3@example.com" });

            const response = await request(app)
                .get("/api/users")
                .set(authHeader(adminToken));

            expect(response.status).toBe(200);
            expect(response.body.users).toHaveLength(4);
            response.body.users.forEach((user: Record<string, unknown>) => {
                expect(user).not.toHaveProperty("password");
            });
        });

        it("returns only the admin when no other users exist", async () => {
            const response = await request(app)
                .get("/api/users")
                .set(authHeader(adminToken));

            expect(response.status).toBe(200);
            expect(response.body.users).toHaveLength(1);
        });
    });

    describe("GET /api/users/:id", () => {
        it("returns a user by a valid id", async () => {
            const user = await createTestUser({
                email: "fetch.by.id@example.com",
                name: "Fetch By Id",
            });

            const response = await request(app)
                .get(`/api/users/${user._id}`)
                .set(authHeader(adminToken));

            expect(response.status).toBe(200);
            expect(response.body.user.id).toBe(user._id.toString());
            expect(response.body.user.email).toBe(user.email);
        });

        it("returns 404 for a non-existent id", async () => {
            const response = await request(app)
                .get("/api/users/000000000000000000000000")
                .set(authHeader(adminToken));

            expect(response.status).toBe(404);
        });

        it("returns 400 for an invalid ObjectId format", async () => {
            const response = await request(app)
                .get("/api/users/not-a-valid-id")
                .set(authHeader(adminToken));

            expect([400, 422]).toContain(response.status);
        });
    });

    describe("PATCH /api/users/:id", () => {
        it("updates a user role", async () => {
            const user = await createTestUser({
                email: "role.update@example.com",
                role: "viewer",
            });

            const response = await request(app)
                .patch(`/api/users/${user._id}`)
                .set(authHeader(adminToken))
                .send({ role: "analyst" });

            expect(response.status).toBe(200);
            expect(response.body.user.role).toBe("analyst");

            const updated = await UserModel.findById(user._id).lean();
            expect(updated?.role).toBe("analyst");
        });

        it("updates a user name", async () => {
            const user = await createTestUser({
                email: "name.update@example.com",
                name: "Original Name",
            });

            const response = await request(app)
                .patch(`/api/users/${user._id}`)
                .set(authHeader(adminToken))
                .send({ name: "Updated Name" });

            expect(response.status).toBe(200);
            expect(response.body.user.name).toBe("Updated Name");
        });

        it("rejects password updates through the user update endpoint", async () => {
            const user = await createTestUser({
                email: "password.update@example.com",
            });

            const response = await request(app)
                .patch(`/api/users/${user._id}`)
                .set(authHeader(adminToken))
                .send({ password: "newpassword" });

            expect([400, 422]).toContain(response.status);

            const loginResponse = await request(app).post("/api/auth/login").send({
                email: user.email,
                password: "password123",
            });

            expect(loginResponse.status).toBe(200);
        });

        it("returns 404 for a non-existent user", async () => {
            const response = await request(app)
                .patch("/api/users/000000000000000000000000")
                .set(authHeader(adminToken))
                .send({ role: "analyst" });

            expect(response.status).toBe(404);
        });
    });

    describe("PATCH /api/users/:id/deactivate", () => {
        it("deactivates a user", async () => {
            const user = await createTestUser({
                email: "deactivate.me@example.com",
                status: "active",
            });

            const response = await request(app)
                .patch(`/api/users/${user._id}/deactivate`)
                .set(authHeader(adminToken));

            expect(response.status).toBe(200);
            expect(response.body.user.status).toBe("inactive");
        });

        it("prevents a deactivated user from logging in", async () => {
            const user = await createTestUser({
                email: "deactivated.login@example.com",
                status: "active",
            });

            await request(app)
                .patch(`/api/users/${user._id}/deactivate`)
                .set(authHeader(adminToken));

            const response = await request(app).post("/api/auth/login").send({
                email: user.email,
                password: "password123",
            });

            expect(response.status).toBe(401);
        });
    });
});
