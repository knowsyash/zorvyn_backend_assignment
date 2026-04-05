import { Response } from "express";

export const success = (
    res: Response,
    data: unknown,
    message: string,
    statusCode = 200
): Response => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

export const paginated = (
    res: Response,
    data: unknown,
    total: number,
    page: number,
    limit: number
): Response => {
    return res.status(200).json({
        success: true,
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
};
