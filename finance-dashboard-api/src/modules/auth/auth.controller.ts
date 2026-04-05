import { NextFunction, Request, Response } from "express";
import { login, register } from "./auth.service";
import { LoginSchema, RegisterSchema } from "./auth.schema";
import { AppError, UnauthorizedError } from "../../utils/errors";
import { success } from "../../utils/response";

export const registerHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = RegisterSchema.safeParse(req.body);

        if (!parsed.success) {
            return next(new AppError("Validation failed", 422));
        }

        const user = await register({
            ...parsed.data,
            email: parsed.data.email.trim().toLowerCase(),
            name: parsed.data.name.trim(),
        });

        success(res, { user }, "User registered", 201);
    } catch (error) {
        if (error instanceof Error && error.message === "EMAIL_EXISTS") {
            return next(new AppError("Email is already registered", 409));
        }

        next(new AppError("Registration failed", 500));
    }
};

export const loginHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = LoginSchema.safeParse(req.body);

        if (!parsed.success) {
            return next(new AppError("Validation failed", 422));
        }

        const result = await login(
            parsed.data.email.trim().toLowerCase(),
            parsed.data.password
        );

        res.cookie("access_token", result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        success(res, result, "Login successful");
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "INACTIVE_USER") {
                return next(new UnauthorizedError("User is inactive"));
            }

            if (error.message === "INVALID_CREDENTIALS") {
                return next(new UnauthorizedError("Invalid email or password"));
            }
        }

        next(new AppError("Login failed", 500));
    }
};
