import { prisma } from "../../lib/prisma.js";

export const createNotification = async (
  type: string,
  userId: string,
  payload: object
) => {
  if (!type || !userId || !payload) {
    throw new Error("Required fields are missing");
  }

  let read: boolean = false;

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      payload,
      read,
    },
  });

  return notification;
};

export const getNotification = async (userId: string) => {
  if (!userId) {
    throw new Error("Required fields are missing");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error("User does not exist");
  }

  const notification = await prisma.notification.findMany({
    where: { userId },
  });

  return notification;
};

export const getUnreadNotification = async (userId: string) => {
  if (!userId) {
    throw new Error("Required fields are missing");
  }

  const user = prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error("User does not exist");
  }

  const unreadNotification = prisma.notification.findMany({
    where: { id: userId, read: false },
  });
  return unreadNotification;
};

export const patchUnreadNotification = async (notificationId: string) => {
  if (!notificationId) {
    throw new Error("Required fields are missing");
  }
  let notification = prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  return notification;
};
