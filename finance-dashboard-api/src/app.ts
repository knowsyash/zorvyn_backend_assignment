import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import authRouter from "./modules/auth/auth.routes";
import usersRouter from "./modules/users/users.routes";
import recordsRouter from "./modules/records/records.routes";
import dashboardRouter from "./modules/dashboard/dashboard.routes";
import { env } from "./config/env";
import { swaggerSpec } from "./config/swagger";
import { requireDatabaseConnection } from "./middlewares/db-ready.middleware";
import { NotFoundError } from "./utils/errors";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

const demoModeEnabled = env.enableDemoSeed || env.enableDemoResetEndpoint;

const swaggerCustomCss = demoModeEnabled
    ? [
        ".swagger-ui .topbar { border-bottom: 4px solid #00a67d; }",
        ".swagger-ui .info:before {",
        "  content: 'Demo mode enabled: use /api/users/demo/seed and /api/users/demo/reset after admin authorization.';",
        "  display: block;",
        "  background: #e9fff8;",
        "  color: #0a5f4b;",
        "  border: 1px solid #9fe4cf;",
        "  border-radius: 8px;",
        "  padding: 10px 12px;",
        "  margin: 8px 0 16px;",
        "  font-weight: 600;",
        "}",
    ].join("\n")
    : "";

app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customSiteTitle: "Finance Dashboard API Docs",
        customCss: swaggerCustomCss,
        swaggerOptions: {
            persistAuthorization: true,
            requestInterceptor: (request: any) => {
                const token = window.localStorage.getItem("swagger_access_token");

                if (token && !request.headers.Authorization) {
                    request.headers.Authorization = `Bearer ${token}`;
                }

                return request;
            },
            responseInterceptor: (response: any) => {
                try {
                    if (
                        response?.url?.includes("/api/auth/login") &&
                        typeof response?.text === "string"
                    ) {
                        const parsed = JSON.parse(response.text);
                        const token = parsed?.data?.token;

                        if (token) {
                            window.localStorage.setItem("swagger_access_token", token);
                        }
                    }
                } catch {
                    // Ignore parse failures and pass through response as-is.
                }

                return response;
            },
        },
    })
);
app.use("/api/auth", requireDatabaseConnection);
app.use("/api/users", requireDatabaseConnection);
app.use("/api/records", requireDatabaseConnection);
app.use("/api/dashboard", requireDatabaseConnection);

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/records", recordsRouter);
app.use("/api/dashboard", dashboardRouter);

app.use((_req, _res, next) => {
    next(new NotFoundError("Route not found"));
});

app.use(errorHandler);

export default app;
