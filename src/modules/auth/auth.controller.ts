import type { Request, Response, NextFunction } from "express";
import { getUser, loginUser, registerUser } from "./auth.service.js";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, email, password } = req.body;

  const result = await registerUser(name, email, password);

  return res.status(201).json({ message: "Registered", data: result });
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;

  const result = await loginUser(email, password);

  return res.status(200).json({ message: "Logged In", data: result });
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  const id = (req as any).user.id;

  const result = await getUser(id);

  return res.status(200).json({ message: "User founded", data: result });
};
