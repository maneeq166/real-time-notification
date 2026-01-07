import { prisma } from "../../lib/prisma.js";

export const createNotification = async (
  type: string,
  userId: string,
  payload: object
) => {
  if (!type || !userId || !payload) {
    throw new Error("Required fields are missing");
  }

  if (!payload.actor.id) {
    throw new Error("Actor id Required");
  }

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      payload,
    },
  });

  return notification;
};

// export const getNotification = async (userId: string) => {
//   if (!userId) {
//     throw new Error("Required fields are missing");
//   }

//   const user = await prisma.user.findUnique({ where: { id: userId } });

//   if (!user) {
//     throw new Error("User does not exist");
//   }

//   const notification = await prisma.notification.findMany({
//     where: { userId },
//   });

//   return notification;
// };

export const getUnreadNotification = async (userId: string) => {
  if (!userId) {
    throw new Error("Required fields are missing");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error("User does not exist");
  }

  const unreadNotification = await prisma.notification.findMany({
    where: { userId, read: false },
  });

  const result = {
    unreadNotification,
    length: unreadNotification.length,
  };

  return result;
};

export const patchUnreadNotification = async (
  notificationId: string,
  userId: string
) => {
  if (!notificationId) {
    throw new Error("Required fields are missing");
  }
  let notification = prisma.notification.update({
    where: { id: notificationId, userId },
    data: { read: true },
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  return notification;
};

export const patchUnreadAllNotification = async (userId: string) => {
  if (!userId) {
    throw new Error("Required fields are missing");
  }

  const notifications = await prisma.notification.updateMany({
    where: { userId },
    data: { read: true },
  });

  if (!notifications) {
    throw new Error("Notification not found");
  }

  return notifications;
};
