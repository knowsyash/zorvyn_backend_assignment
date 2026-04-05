import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
    createRecord,
    deleteRecord,
    getRecordById,
    getRecords,
    updateRecord,
} from "./records.service";
import { CreateRecordSchema, FilterSchema, UpdateRecordSchema } from "./records.schema";
import { AppError, NotFoundError } from "../../utils/errors";

const ParamsIdSchema = z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid record id"),
});

export const createRecordHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = CreateRecordSchema.safeParse(req.body);

        if (!parsed.success) {
            return next(new AppError("Validation failed", 422));
        }

        const record = await createRecord(parsed.data, req.user!.id);
        res.status(201).json({ record });
    } catch (error) {
        next(new AppError("Failed to create record", 500));
    }
};

export const getRecordsHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = FilterSchema.safeParse(req.query);

        if (!parsed.success) {
            return next(new AppError("Validation failed", 422));
        }

        const result = await getRecords(parsed.data);
        res.status(200).json(result);
    } catch (error) {
        next(new AppError("Failed to fetch records", 500));
    }
};

export const getRecordByIdHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = ParamsIdSchema.safeParse(req.params);

        if (!parsed.success) {
            return next(new AppError("Invalid record id", 400));
        }

        const record = await getRecordById(parsed.data.id);
        res.status(200).json({ record });
    } catch (error) {
        if (error instanceof Error && error.message === "RECORD_NOT_FOUND") {
            return next(new NotFoundError("Record not found"));
        }

        next(new AppError("Failed to fetch record", 500));
    }
};

export const updateRecordHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const paramsValidation = ParamsIdSchema.safeParse(req.params);

        if (!paramsValidation.success) {
            return next(new AppError("Invalid record id", 400));
        }

        const bodyValidation = UpdateRecordSchema.safeParse(req.body);

        if (!bodyValidation.success) {
            return next(new AppError("Validation failed", 422));
        }

        const record = await updateRecord(
            paramsValidation.data.id,
            bodyValidation.data
        );
        res.status(200).json({ record });
    } catch (error) {
        if (error instanceof Error && error.message === "RECORD_NOT_FOUND") {
            return next(new NotFoundError("Record not found"));
        }

        next(new AppError("Failed to update record", 500));
    }
};

export const deleteRecordHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = ParamsIdSchema.safeParse(req.params);

        if (!parsed.success) {
            return next(new AppError("Invalid record id", 400));
        }

        await deleteRecord(parsed.data.id);
        res.status(200).json({ message: "Record deleted" });
    } catch (error) {
        if (error instanceof Error && error.message === "RECORD_NOT_FOUND") {
            return next(new NotFoundError("Record not found"));
        }

        next(new AppError("Failed to delete record", 500));
    }
};
