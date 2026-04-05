import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";
import { ValidationError } from "./errors";

export const validateBody = <T>(schema: ZodSchema<T>) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                next(new ValidationError("Validation failed", error.flatten()));
                return;
            }

            next(error as Error);
        }
    };
};

export const validateQuery = <T>(schema: ZodSchema<T>) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            req.query = schema.parse(req.query) as Request["query"];
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                next(new ValidationError("Validation failed", error.flatten()));
                return;
            }

            next(error as Error);
        }
    };
};
