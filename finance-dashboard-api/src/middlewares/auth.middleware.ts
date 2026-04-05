import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";

const getTokenFromCookie = (cookieHeader?: string): string | null => {
    if (!cookieHeader) {
        return null;
    }

    const tokenCookie = cookieHeader
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith("access_token="));

    if (!tokenCookie) {
        return null;
    }

    const rawToken = tokenCookie.slice("access_token=".length);
    return rawToken ? decodeURIComponent(rawToken) : null;
};

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    const authorization = req.headers.authorization;
    const headerToken = authorization?.startsWith("Bearer ")
        ? authorization.split(" ")[1]
        : null;
    const cookieToken = getTokenFromCookie(req.headers.cookie);
    const token = headerToken || cookieToken;

    if (!token) {
        res.status(401).json({ message: "Missing or invalid authorization header" });
        return;
    }

    try {
        const payload = verifyAccessToken(token);
        req.user = {
            id: payload.id,
            email: payload.email,
            role: payload.role,
        };

        next();
    } catch {
        res.status(401).json({ message: "Invalid or expired token" });
    }
};
