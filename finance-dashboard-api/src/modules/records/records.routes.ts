import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import {
    createRecordHandler,
    deleteRecordHandler,
    getRecordByIdHandler,
    getRecordsHandler,
    updateRecordHandler,
} from "./records.controller";

const recordsRouter = Router();

recordsRouter.get("/", authenticate, authorize("viewer", "analyst", "admin"), getRecordsHandler);
recordsRouter.get(
    "/:id",
    authenticate,
    authorize("viewer", "analyst", "admin"),
    getRecordByIdHandler
);
recordsRouter.post("/", authenticate, authorize("admin"), createRecordHandler);
recordsRouter.patch("/:id", authenticate, authorize("admin"), updateRecordHandler);
recordsRouter.delete("/:id", authenticate, authorize("admin"), deleteRecordHandler);

export default recordsRouter;
