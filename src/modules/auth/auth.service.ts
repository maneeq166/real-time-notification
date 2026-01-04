import { prisma } from "../../lib/prisma.js";
import bcrypt, { compare } from "bcrypt";
import jwt from "jsonwebtoken";

export const registerUser = async (
  name: string,
  email: string,
  password: string
) => {
  if (!name || !email || !password) {
    throw new Error("Required fields are missing");
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return user;
};

export const loginUser = async (email: string, password: string) => {
  if (!email || !password) {
    throw new Error("Required fields are missing");
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (!existing) {
    throw new Error("User not found");
  }

  const isMatch = await bcrypt.compare(password, existing.password);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    { id: existing.id },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  return token;
};

export const getUser = async (id: string) => {
  try {
    if (!id) {
      throw new Error("Id cannot be null");
    }

    const existing = prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (!existing) {
      throw new Error("User does not exist");
    }

    return existing;
  } catch (error) {}
};
