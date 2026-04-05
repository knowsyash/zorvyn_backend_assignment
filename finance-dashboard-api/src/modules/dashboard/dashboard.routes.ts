import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import {
    getCategoryBreakdownHandler,
    getMonthlyTrendsHandler,
    getRecentActivityHandler,
    getSummaryHandler,
} from "./dashboard.controller";

const dashboardRouter = Router();

dashboardRouter.use(authenticate);
dashboardRouter.use(authorize("analyst", "admin"));

dashboardRouter.get("/summary", getSummaryHandler);
dashboardRouter.get("/categories", getCategoryBreakdownHandler);
dashboardRouter.get("/recent", getRecentActivityHandler);
dashboardRouter.get("/trends", getMonthlyTrendsHandler);

export default dashboardRouter;
