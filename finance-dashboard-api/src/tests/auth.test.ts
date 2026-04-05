import request from "supertest";
import app from "../app";
import { createTestUser } from "./helpers";

describe("Auth module", () => {
    describe("POST /api/auth/register", () => {
        it("registers a new viewer user successfully and omits the password field", async () => {
            const response = await request(app).post("/api/auth/register").send({
                name: "New Viewer",
                email: "viewer.register@example.com",
                password: "password123",
                role: "viewer",
            });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user).not.toHaveProperty("password");
            expect(response.body.data.user.email).toBe("viewer.register@example.com");
        });

        it("fails when the email already exists", async () => {
            await createTestUser({ email: "duplicate@example.com" });

            const response = await request(app).post("/api/auth/register").send({
                name: "Duplicate User",
                email: "duplicate@example.com",
                password: "password123",
                role: "viewer",
            });

            expect(response.status).toBe(409);
        });

        it("fails when required fields are missing", async () => {
            const response = await request(app).post("/api/auth/register").send({});

            expect(response.status).toBe(422);
            expect(response.body.message).toBe("Validation failed");
        });

        it("fails when the password is shorter than 6 characters", async () => {
            const response = await request(app).post("/api/auth/register").send({
                name: "Short Password User",
                email: "short.password@example.com",
                password: "abc",
                role: "viewer",
            });

            expect(response.status).toBe(422);
        });

        it("fails when the role is invalid", async () => {
            const response = await request(app).post("/api/auth/register").send({
                name: "Invalid Role User",
                email: "invalid.role@example.com",
                password: "password123",
                role: "superadmin",
            });

            expect(response.status).toBe(422);
        });

        it("fails when the email format is invalid", async () => {
            const response = await request(app).post("/api/auth/register").send({
                name: "Invalid Email User",
                email: "not-an-email",
                password: "password123",
                role: "viewer",
            });

            expect(response.status).toBe(422);
        });

        it("fails when the name is missing", async () => {
            const response = await request(app).post("/api/auth/register").send({
                email: "missing.name@example.com",
                password: "password123",
                role: "viewer",
            });

            expect(response.status).toBe(422);
        });
    });

    describe("POST /api/auth/login", () => {
        it("logs in successfully with correct credentials and returns a token", async () => {
            const user = await createTestUser({
                email: "login.success@example.com",
                password: "password123",
            });

            const response = await request(app).post("/api/auth/login").send({
                email: user.email,
                password: "password123",
            });

            expect(response.status).toBe(200);
            expect(response.body.data.token).toEqual(expect.any(String));
            expect(response.body.data.user.email).toBe(user.email);
            expect(response.body.data.user).not.toHaveProperty("password");
        });

        it("fails when the password is wrong", async () => {
            await createTestUser({ email: "wrong.password@example.com" });

            const response = await request(app).post("/api/auth/login").send({
                email: "wrong.password@example.com",
                password: "wrongpassword",
            });

            expect(response.status).toBe(401);
        });

        it("fails when the user does not exist", async () => {
            const response = await request(app).post("/api/auth/login").send({
                email: "missing.user@example.com",
                password: "password123",
            });

            expect(response.status).toBe(401);
        });

        it("fails when the user is inactive", async () => {
            await createTestUser({
                email: "inactive.user@example.com",
                status: "inactive",
            });

            const response = await request(app).post("/api/auth/login").send({
                email: "inactive.user@example.com",
                password: "password123",
            });

            expect([401, 403]).toContain(response.status);
        });

        it("fails when the email format is invalid", async () => {
            const response = await request(app).post("/api/auth/login").send({
                email: "not-an-email",
                password: "password123",
            });

            expect(response.status).toBe(422);
        });

        it("returns a JWT token in header.payload.signature format", async () => {
            await createTestUser({
                email: "jwt.format@example.com",
                password: "password123",
            });

            const response = await request(app).post("/api/auth/login").send({
                email: "jwt.format@example.com",
                password: "password123",
            });

            expect(response.status).toBe(200);
            const token = response.body.data.token as string;
            expect(token.split(".")).toHaveLength(3);
        });
    });
});
