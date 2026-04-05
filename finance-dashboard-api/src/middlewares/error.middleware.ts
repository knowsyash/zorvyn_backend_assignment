import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    const isDevelopment = process.env.NODE_ENV === "development";

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            statusCode: err.statusCode,
            details: err.details,
            stack: isDevelopment ? err.stack : undefined,
        });
        return;
    }

    if (err instanceof ZodError) {
        res.status(422).json({
            success: false,
            message: "Validation failed",
            statusCode: 422,
            errors: err.flatten(),
            stack: isDevelopment ? err.stack : undefined,
        });
        return;
    }

    res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
        stack: isDevelopment && err instanceof Error ? err.stack : undefined,
    });
};
