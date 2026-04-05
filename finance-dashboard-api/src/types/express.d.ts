declare namespace Express {
    export interface Request {
        user?: {
            id: string;
            email: string;
            role: "viewer" | "analyst" | "admin";
        };
    }
}
