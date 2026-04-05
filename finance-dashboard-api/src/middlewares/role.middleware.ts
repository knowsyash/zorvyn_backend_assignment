import { NextFunction, Request, Response } from "express";

export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const currentRole = req.user?.role;

        if (!currentRole || !roles.includes(currentRole)) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }

        next();
    };
};
