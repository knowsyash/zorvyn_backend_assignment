import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import {
    deactivateUserHandler,
    getAllUsersHandler,
    getUserByIdHandler,
    seedDemoDataHandler,
    resetDemoDataHandler,
    updateUserHandler,
} from "./users.controller";

const usersRouter = Router();

usersRouter.use(authenticate);
usersRouter.use(authorize("admin"));

usersRouter.get("/", getAllUsersHandler);
usersRouter.post("/demo/seed", seedDemoDataHandler);
usersRouter.post("/demo/reset", resetDemoDataHandler);
usersRouter.get("/:id", getUserByIdHandler);
usersRouter.patch("/:id", updateUserHandler);
usersRouter.patch("/:id/deactivate", deactivateUserHandler);

export default usersRouter;
