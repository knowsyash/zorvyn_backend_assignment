import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

export const requireDatabaseConnection = (
    _req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (mongoose.connection.readyState !== 1) {
        res.status(503).json({
            success: false,
            message: "Database is not connected. Please try again in a few seconds.",
            statusCode: 503,
        });
        return;
    }

    next();
};
