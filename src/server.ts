import express from "express";
import type { Express } from "express";
import { authRouter } from "./modules/auth/auth.route.js";
import { notficationRouter } from "./modules/notifications/notification.route.js";
const app: Express = express();

app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/notification", notficationRouter);

export { app };
