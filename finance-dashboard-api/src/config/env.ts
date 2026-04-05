import dotenv from "dotenv";

dotenv.config();
const mongoUri = process.env.MONGO_URI || "";


export const env = {
    port: Number(process.env.PORT || 4000),
    host: process.env.HOST || "0.0.0.0",
    mongoUri,
    mongoDbName: process.env.MONGO_DB_NAME || "finance-dashboard",
    jwtSecret: process.env.JWT_SECRET || "replace_me",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    nodeEnv: process.env.NODE_ENV || "development",
    enableDemoSeed: process.env.ENABLE_DEMO_SEED ? process.env.ENABLE_DEMO_SEED === "true" : (process.env.NODE_ENV || "development") !== "production",
    enableDemoResetEndpoint: process.env.ENABLE_DEMO_RESET_ENDPOINT
        ? process.env.ENABLE_DEMO_RESET_ENDPOINT === "true"
        : (process.env.NODE_ENV || "development") !== "production",
    demoAdminEmail: process.env.DEMO_ADMIN_EMAIL || "admin@finance.com",
    demoAdminPassword: process.env.DEMO_ADMIN_PASSWORD || "admin123",
    demoAnalystEmail: process.env.DEMO_ANALYST_EMAIL || "analyst@finance.com",
    demoAnalystPassword: process.env.DEMO_ANALYST_PASSWORD || "analyst123",
    demoViewerEmail: process.env.DEMO_VIEWER_EMAIL || "viewer@finance.com",
    demoViewerPassword: process.env.DEMO_VIEWER_PASSWORD || "viewer123",
};
