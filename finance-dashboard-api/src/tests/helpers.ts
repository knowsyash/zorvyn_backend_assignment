import type { Express } from "express";
import request from "supertest";
import app from "../app";
import { Types } from "mongoose";
import { UserModel } from "../modules/auth/user.model";
import { RecordModel } from "../modules/records/record.model";

type UserRole = "viewer" | "analyst" | "admin";
type UserStatus = "active" | "inactive";
type RecordType = "income" | "expense";

type CreateTestUserOverrides = Partial<{
    name: string;
    email: string;
    password: string;
    role: UserRole;
    status: UserStatus;
}>;

type CreateTestRecordOverrides = Partial<{
    amount: number;
    type: RecordType;
    category: string;
    date: string | Date;
    notes: string;
    isDeleted: boolean;
}>;

export const apiRequest = request(app);

const toDateString = (value: string | Date): string => {
    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }

    return value;
};

const getDefaultCreatorId = async (): Promise<string> => {
    const existingUser = await UserModel.findOne({}).select("_id").lean<{ _id: unknown }>();

    if (existingUser?._id) {
        return String(existingUser._id);
    }

    const user = await createTestUser();
    return String(user._id);
};

export const createTestUser = async (overrides: CreateTestUserOverrides = {}) => {
    const user = await UserModel.create({
        name: overrides.name ?? "Test User",
        email: overrides.email ?? "test@example.com",
        password: overrides.password ?? "password123",
        role: overrides.role ?? "viewer",
        status: overrides.status ?? "active",
    });

    return user;
};

export const createTestAdmin = async (overrides: CreateTestUserOverrides = {}) => {
    return createTestUser({
        name: overrides.name ?? "Admin User",
        email: overrides.email ?? "admin@example.com",
        password: overrides.password ?? "password123",
        role: "admin",
        status: overrides.status ?? "active",
    });
};

export const createTestAnalyst = async (
    overrides: CreateTestUserOverrides = {}
) => {
    return createTestUser({
        name: overrides.name ?? "Analyst User",
        email: overrides.email ?? "analyst@example.com",
        password: overrides.password ?? "password123",
        role: "analyst",
        status: overrides.status ?? "active",
    });
};

export const loginAs = async (
    appOrEmail: Express | string,
    emailOrPassword: string,
    maybePassword?: string
) => {
    const appInstance = typeof appOrEmail === "string" ? app : appOrEmail;
    const email = typeof appOrEmail === "string" ? appOrEmail : emailOrPassword;
    const password = typeof appOrEmail === "string" ? emailOrPassword : maybePassword;

    if (!password) {
        throw new Error("loginAs requires email and password");
    }

    const response = await request(appInstance)
        .post("/api/auth/login")
        .send({ email, password });

    if (!response.body?.data?.token) {
        throw new Error(
            `Login failed for ${email} with status ${response.status}: ${response.body?.message ?? "unknown error"}`
        );
    }

    return response.body.data as { token: string; user: unknown };
};

export const authHeader = (token: string) => ({
    Authorization: `Bearer ${token}`,
});

export const createTestRecord = async (
    overrides: CreateTestRecordOverrides = {},
    createdById?: string
) => {
    const resolvedCreatedById = createdById ?? (await getDefaultCreatorId());

    const record = await RecordModel.create({
        amount: overrides.amount ?? 1000,
        type: overrides.type ?? "income",
        category: overrides.category ?? "Salary",
        date: toDateString(overrides.date ?? new Date()),
        notes: overrides.notes ?? "Test record",
        createdBy: new Types.ObjectId(resolvedCreatedById),
        isDeleted: overrides.isDeleted ?? false,
    });

    return record;
};
