import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { deactivateUser, getAllUsers, getUserById, updateUser } from "./users.service";
import { AppError, NotFoundError } from "../../utils/errors";
import { env } from "../../config/env";
import { refreshDemoData, resetDemoData } from "../../config/seed";

const ParamsIdSchema = z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid user id"),
});

const UpdateUserSchema = z
    .object({
        name: z.string().min(2).optional(),
        role: z.enum(["viewer", "analyst", "admin"]).optional(),
        status: z.enum(["active", "inactive"]).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
        message: "At least one field is required",
    });

export const getAllUsersHandler = async (
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const users = await getAllUsers();
        res.status(200).json({ users });
    } catch (error) {
        next(new AppError("Failed to fetch users", 500));
    }
};

export const getUserByIdHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const params = ParamsIdSchema.safeParse(req.params);

        if (!params.success) {
            return next(new AppError("Invalid user id", 400));
        }

        const user = await getUserById(params.data.id);
        res.status(200).json({ user });
    } catch (error) {
        if (error instanceof Error && error.message === "USER_NOT_FOUND") {
            return next(new NotFoundError("User not found"));
        }

        next(new AppError("Failed to fetch user", 500));
    }
};

export const updateUserHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const params = ParamsIdSchema.safeParse(req.params);
        const body = UpdateUserSchema.safeParse(req.body);

        if (!params.success) {
            return next(new AppError("Invalid user id", 400));
        }

        if (!body.success) {
            return next(new AppError("Validation failed", 422));
        }

        const updatedUser = await updateUser(params.data.id, body.data);
        res.status(200).json({ user: updatedUser });
    } catch (error) {
        if (error instanceof Error && error.message === "USER_NOT_FOUND") {
            return next(new NotFoundError("User not found"));
        }

        if (error instanceof Error && error.message === "NO_UPDATABLE_FIELDS") {
            return next(new AppError("Validation failed", 422));
        }

        next(new AppError("Failed to update user", 500));
    }
};

export const deactivateUserHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const params = ParamsIdSchema.safeParse(req.params);

        if (!params.success) {
            return next(new AppError("Invalid user id", 400));
        }

        const user = await deactivateUser(params.data.id);
        res.status(200).json({ user });
    } catch (error) {
        if (error instanceof Error && error.message === "USER_NOT_FOUND") {
            return next(new NotFoundError("User not found"));
        }

        next(new AppError("Failed to deactivate user", 500));
    }
};

export const resetDemoDataHandler = async (
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    if (!env.enableDemoResetEndpoint) {
        return next(new NotFoundError("Route not found"));
    }

    try {
        const resetSummary = await resetDemoData();
        res.status(200).json({
            message: "Demo data reset successfully",
            resetSummary,
        });
    } catch (error) {
        next(new AppError("Failed to reset demo data", 500));
    }
};

export const seedDemoDataHandler = async (
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    if (!env.enableDemoSeed) {
        return next(new NotFoundError("Route not found"));
    }

    try {
        const seedSummary = await refreshDemoData();
        res.status(200).json({
            message: "Demo data seeded successfully",
            seedSummary,
        });
    } catch (error) {
        next(new AppError("Failed to seed demo data", 500));
    }
};
