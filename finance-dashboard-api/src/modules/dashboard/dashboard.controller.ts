import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
    getCategoryBreakdown,
    getMonthlyTrends,
    getRecentActivity,
    getSummary,
} from "./dashboard.service";
import { AppError } from "../../utils/errors";

const RecentQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(100).default(10),
});

const TrendsQuerySchema = z.object({
    year: z.coerce
        .number()
        .int()
        .min(1970)
        .max(3000)
        .default(new Date().getFullYear()),
});

/**
 * Handler for GET /api/dashboard/summary
 * Returns total income, expenses, net balance, and record count.
 */
export const getSummaryHandler = async (
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const summary = await getSummary();
        res.status(200).json(summary);
    } catch (error) {
        next(new AppError("Failed to fetch summary", 500));
    }
};

/**
 * Handler for GET /api/dashboard/categories
 * Returns breakdown of records by category and type.
 */
export const getCategoryBreakdownHandler = async (
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const categories = await getCategoryBreakdown();
        res.status(200).json(categories);
    } catch (error) {
        next(new AppError("Failed to fetch category breakdown", 500));
    }
};

/**
 * Handler for GET /api/dashboard/recent?limit=10
 * Returns recent financial records with user information.
 */
export const getRecentActivityHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = RecentQuerySchema.safeParse(req.query);

        if (!parsed.success) {
            return next(
                new AppError("Invalid query parameters", 400)
            );
        }

        const records = await getRecentActivity(parsed.data.limit);
        res.status(200).json(records);
    } catch (error) {
        next(new AppError("Failed to fetch recent activity", 500));
    }
};

/**
 * Handler for GET /api/dashboard/trends?year=2024
 * Returns monthly income/expense trends for the specified year.
 */
export const getMonthlyTrendsHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = TrendsQuerySchema.safeParse(req.query);

        if (!parsed.success) {
            return next(
                new AppError("Invalid query parameters", 400)
            );
        }

        const trends = await getMonthlyTrends(parsed.data.year);
        res.status(200).json(trends);
    } catch (error) {
        next(new AppError("Failed to fetch monthly trends", 500));
    }
};
