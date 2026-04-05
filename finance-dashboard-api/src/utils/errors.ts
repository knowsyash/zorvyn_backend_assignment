export class AppError extends Error {
    statusCode: number;
    details?: unknown;

    constructor(message: string, statusCode: number) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Resource not found") {
        super(message, 404);
        this.name = "NotFoundError";
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(message, 401);
        this.name = "UnauthorizedError";
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Forbidden") {
        super(message, 403);
        this.name = "ForbiddenError";
    }
}

export class ValidationError extends AppError {
    constructor(message = "Validation failed", details?: unknown) {
        super(message, 422);
        this.name = "ValidationError";
        this.details = details;
    }
}
