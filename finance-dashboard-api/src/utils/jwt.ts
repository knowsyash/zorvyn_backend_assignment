import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type JwtPayload = {
    id: string;
    email: string;
    role: "viewer" | "analyst" | "admin";
};

export const signAccessToken = (
    payload: JwtPayload,
    expiresIn?: jwt.SignOptions["expiresIn"]
): string => {
    return jwt.sign(payload, env.jwtSecret, {
        expiresIn: expiresIn ?? (env.jwtExpiresIn as jwt.SignOptions["expiresIn"]),
    });
};

export const verifyAccessToken = (token: string): JwtPayload => {
    return jwt.verify(token, env.jwtSecret) as JwtPayload;
};
