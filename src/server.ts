import express from "express";
import type { Express, Request, Response } from "express";
import { authRouter } from "./modules/auth/auth.route.js";

const app: Express = express();

app.use(express.json());
app.use("/api/auth", authRouter);

export { app };
