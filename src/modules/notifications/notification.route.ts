import { Router } from "express";
import { create, get, update } from "./notification.controller.js";

const notficationRouter = Router();

notficationRouter.post("/", create);
notficationRouter.get("/", get);
notficationRouter.patch("/", update);
export { notficationRouter };
