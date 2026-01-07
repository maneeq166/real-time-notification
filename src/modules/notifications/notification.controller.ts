import type { Request, Response, NextFunction } from "express";
import {
  createNotification,
  getNotification,
  patchUnreadNotification,
} from "./notification.service.js";

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { type, userId, payload } = req.body;
  const result = await createNotification(type, userId, payload);
  return res
    .status(201)
    .json({ message: "Notification created", data: result });
};

export const get = async (req: Request, res: Response, next: NextFunction) => {
  const id = (req as any).user.id;

  const result = await getNotification(id);
  return res
    .status(200)
    .json({ message: "Notification fetched", data: result });
};

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { notificationId } = req.body;

  const result = await patchUnreadNotification(notificationId);

  return res
    .status(200)
    .json({ message: "Notification updation", data: result });
};
