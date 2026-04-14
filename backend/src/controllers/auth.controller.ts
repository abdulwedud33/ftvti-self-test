import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../utils/prisma";
import { signToken } from "../utils/jwt";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const updateProfileSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters").optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
  })
  .refine((data) => data.username !== undefined || data.password !== undefined, {
    message: "At least one field is required",
  });

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = signToken({ userId: user.id, username: user.username, role: user.role });

    // Set httpOnly cookie
    // SameSite=None + Secure required for cross-origin requests (Vercel → Render)
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Fetch student profile if student role
    let studentData = null;
    if (user.role === "STUDENT") {
      studentData = await prisma.student.findUnique({
        where: { userId: user.id },

      });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        student: studentData,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

export const logout = (_req: Request, res: Response): void => {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });
  res.json({ message: "Logged out successfully" });
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, username: true, role: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    let studentData = null;
    if (user.role === "STUDENT") {
      studentData = await prisma.student.findUnique({
        where: { userId: user.id },

      });
    }

    res.json({ ...user, student: studentData });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const data = updateProfileSchema.parse(req.body);
    const updates: { username?: string; password?: string } = {};

    if (data.username !== undefined) {
      const trimmedUsername = data.username.trim();
      if (trimmedUsername.length < 3) {
        res.status(400).json({ error: "Username must be at least 3 characters" });
        return;
      }

      const existing = await prisma.user.findUnique({ where: { username: trimmedUsername } });
      if (existing && existing.id !== userId) {
        res.status(409).json({ error: "Username is already taken" });
        return;
      }
      updates.username = trimmedUsername;
    }

    if (data.password !== undefined) {
      updates.password = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: { id: true, username: true, role: true },
    });

    // Refresh session token so username changes are reflected immediately.
    const token = signToken({
      userId: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
    });
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: "Failed to update profile" });
  }
};
