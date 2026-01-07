import { Router } from "express";
import { create, get, update, updateAll } from "./notification.controller.js";
import { authMiddleware } from "../auth/auth.middleware.js";

const notficationRouter = Router();

notficationRouter.post("/", authMiddleware, create);
notficationRouter.get("/", authMiddleware, get);
notficationRouter.patch("/", authMiddleware, update);
notficationRouter.patch("/all-notification", authMiddleware, updateAll);

export { notficationRouter };
