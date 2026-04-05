import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
    openapi: "3.0.3",
    info: {
        title: "Finance Dashboard API",
        version: "1.0.0",
        description:
            "Backend API documentation for finance dashboard.\n\n" +
            "Demo flow for recruiters:\n" +
            "- Log in with a demo account\n" +
            "- Authorize with Bearer <token>\n" +
            "- Use POST /api/users/demo/seed to refresh the demo Atlas data set\n" +
            "- Use POST /api/users/demo/reset if you want a clean re-run\n\n" +
            "Demo roles: admin, analyst, viewer",
    },
    servers: [
        {
            url: "/",
            description: "Current host",
        },
    ],
    tags: [
        { name: "Health", description: "Service health checks" },
        { name: "Auth", description: "Authentication endpoints" },
        { name: "Users", description: "User management (admin only)" },
        { name: "Records", description: "Financial records" },
        { name: "Dashboard", description: "Dashboard analytics" },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
        schemas: {
            LoginInput: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: { type: "string", format: "email", example: "admin@finance.com" },
                    password: { type: "string", minLength: 6, example: "admin123" },
                },
            },
            LoginSuccessResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Login successful" },
                    data: {
                        type: "object",
                        properties: {
                            token: {
                                type: "string",
                                example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                            },
                            user: {
                                type: "object",
                                properties: {
                                    id: { type: "string", example: "507f1f77bcf86cd799439011" },
                                    name: { type: "string", example: "Demo Admin" },
                                    email: { type: "string", format: "email", example: "admin@finance.com" },
                                    role: { type: "string", enum: ["viewer", "analyst", "admin"] },
                                    status: { type: "string", enum: ["active", "inactive"] },
                                },
                            },
                        },
                    },
                },
            },
            RegisterInput: {
                type: "object",
                required: ["name", "email", "password", "role"],
                properties: {
                    name: { type: "string", minLength: 2, example: "Jane Doe" },
                    email: { type: "string", format: "email", example: "jane@example.com" },
                    password: { type: "string", minLength: 6, example: "password123" },
                    role: { type: "string", enum: ["viewer", "analyst", "admin"], example: "viewer" },
                },
            },
            User: {
                type: "object",
                properties: {
                    id: { type: "string", example: "507f1f77bcf86cd799439011" },
                    name: { type: "string", example: "Jane Doe" },
                    email: { type: "string", format: "email", example: "jane@example.com" },
                    role: { type: "string", enum: ["viewer", "analyst", "admin"] },
                    status: { type: "string", enum: ["active", "inactive"] },
                    createdAt: { type: "string", format: "date-time" },
                },
            },
            CreateRecordInput: {
                type: "object",
                required: ["amount", "type", "category", "date"],
                properties: {
                    amount: { type: "number", minimum: 0.01, example: 2500 },
                    type: { type: "string", enum: ["income", "expense"], example: "income" },
                    category: { type: "string", example: "Salary" },
                    date: { type: "string", example: "2024-01-15" },
                    notes: { type: "string", example: "January salary" },
                },
            },
            UpdateRecordInput: {
                type: "object",
                properties: {
                    amount: { type: "number", minimum: 0.01, example: 2800 },
                    type: { type: "string", enum: ["income", "expense"] },
                    category: { type: "string", example: "Bonus" },
                    date: { type: "string", example: "2024-01-20" },
                    notes: { type: "string", example: "Updated notes" },
                },
            },
            Record: {
                type: "object",
                properties: {
                    id: { type: "string", example: "507f1f77bcf86cd799439012" },
                    amount: { type: "number", example: 2500 },
                    type: { type: "string", enum: ["income", "expense"] },
                    category: { type: "string", example: "Salary" },
                    date: { type: "string", example: "2024-01-15" },
                    notes: { type: "string", example: "January salary" },
                    createdBy: { type: "string", example: "507f1f77bcf86cd799439011" },
                    isDeleted: { type: "boolean", example: false },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            ErrorResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string", example: "Validation failed" },
                    statusCode: { type: "number", example: 422 },
                    details: {},
                },
            },
        },
    },
    paths: {
        "/api/health": {
            get: {
                tags: ["Health"],
                summary: "Health check",
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "ok" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/auth/register": {
            post: {
                tags: ["Auth"],
                summary: "Register user",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/RegisterInput" },
                        },
                    },
                },
                responses: {
                    "201": { description: "Created" },
                    "409": { description: "Email already exists" },
                    "422": { description: "Validation failed" },
                },
            },
        },
        "/api/auth/login": {
            post: {
                tags: ["Auth"],
                summary: "Login user",
                description:
                    "This endpoint also sets an HttpOnly cookie (access_token). In Swagger UI, protected endpoints can work immediately after login in the same browser session.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/LoginInput" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Authenticated",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/LoginSuccessResponse" },
                            },
                        },
                    },
                    "401": { description: "Unauthorized" },
                    "422": { description: "Validation failed" },
                },
            },
        },
        "/api/users": {
            get: {
                tags: ["Users"],
                summary: "List users",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": { description: "Users list" },
                    "403": { description: "Forbidden" },
                },
            },
        },
        "/api/users/demo/seed": {
            post: {
                tags: ["Users"],
                summary: "Seed or refresh demo users and demo records",
                description:
                    "Admin-only endpoint. Available only when ENABLE_DEMO_SEED=true. Use this after authorizing with a Bearer token to repopulate the demo Atlas database with login-ready users and sample records.",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": { description: "Demo data seeded successfully" },
                    "404": { description: "Route disabled" },
                    "403": { description: "Forbidden" },
                },
            },
        },
        "/api/users/demo/reset": {
            post: {
                tags: ["Users"],
                summary: "Reset demo users and demo records",
                description:
                    "Admin-only endpoint. Available only when ENABLE_DEMO_RESET_ENDPOINT=true.",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": { description: "Demo data reset successfully" },
                    "404": { description: "Route disabled" },
                    "403": { description: "Forbidden" },
                },
            },
        },
        "/api/users/{id}": {
            get: {
                tags: ["Users"],
                summary: "Get user by id",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": { description: "User found" },
                    "404": { description: "User not found" },
                },
            },
            patch: {
                tags: ["Users"],
                summary: "Update user",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    role: { type: "string", enum: ["viewer", "analyst", "admin"] },
                                    status: { type: "string", enum: ["active", "inactive"] },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": { description: "User updated" },
                    "404": { description: "User not found" },
                },
            },
        },
        "/api/users/{id}/deactivate": {
            patch: {
                tags: ["Users"],
                summary: "Deactivate user",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": { description: "User deactivated" },
                    "404": { description: "User not found" },
                },
            },
        },
        "/api/records": {
            get: {
                tags: ["Records"],
                summary: "List records with filters",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: "query", name: "type", schema: { type: "string", enum: ["income", "expense"] } },
                    { in: "query", name: "category", schema: { type: "string" } },
                    { in: "query", name: "from", schema: { type: "string", example: "2024-01-01" } },
                    { in: "query", name: "to", schema: { type: "string", example: "2024-12-31" } },
                    { in: "query", name: "page", schema: { type: "number", example: 1 } },
                    { in: "query", name: "limit", schema: { type: "number", example: 20 } },
                ],
                responses: {
                    "200": { description: "Records list" },
                },
            },
            post: {
                tags: ["Records"],
                summary: "Create record",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreateRecordInput" },
                        },
                    },
                },
                responses: {
                    "201": { description: "Record created" },
                    "403": { description: "Forbidden" },
                    "422": { description: "Validation failed" },
                },
            },
        },
        "/api/records/{id}": {
            get: {
                tags: ["Records"],
                summary: "Get record by id",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": { description: "Record found" },
                    "404": { description: "Record not found" },
                },
            },
            patch: {
                tags: ["Records"],
                summary: "Update record",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UpdateRecordInput" },
                        },
                    },
                },
                responses: {
                    "200": { description: "Record updated" },
                    "404": { description: "Record not found" },
                },
            },
            delete: {
                tags: ["Records"],
                summary: "Soft delete record",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": { description: "Record deleted" },
                    "404": { description: "Record not found" },
                },
            },
        },
        "/api/dashboard/summary": {
            get: {
                tags: ["Dashboard"],
                summary: "Get summary",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": { description: "Summary data" },
                    "403": { description: "Forbidden" },
                },
            },
        },
        "/api/dashboard/categories": {
            get: {
                tags: ["Dashboard"],
                summary: "Get category breakdown",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": { description: "Category breakdown" },
                },
            },
        },
        "/api/dashboard/recent": {
            get: {
                tags: ["Dashboard"],
                summary: "Get recent activity",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: "query", name: "limit", schema: { type: "number", example: 10 } },
                ],
                responses: {
                    "200": { description: "Recent records" },
                },
            },
        },
        "/api/dashboard/trends": {
            get: {
                tags: ["Dashboard"],
                summary: "Get monthly trends",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: "query", name: "year", required: true, schema: { type: "number", example: 2024 } },
                ],
                responses: {
                    "200": { description: "Monthly trend points" },
                },
            },
        },
    },
};

export const swaggerSpec = swaggerJSDoc({
    definition: swaggerDefinition,
    apis: [],
});
