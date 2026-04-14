import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";
import prisma from "../utils/prisma";
import { Stream } from "@prisma/client";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface InstructorScope {
      id: string;
      subjectId: string;
      stream: Stream;
      subjectName: string;
    }

    interface Request {
      user?: JwtPayload;
      instructorScope?: InstructorScope;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "ADMIN") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
};

export const requireInstructor = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "INSTRUCTOR" && req.user?.role !== "ADMIN") {
    res.status(403).json({ error: "Instructor access required" });
    return;
  }
  next();
};

export const requireAdminOrInstructor = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "ADMIN" && req.user?.role !== "INSTRUCTOR") {
    res.status(403).json({ error: "Admin or instructor access required" });
    return;
  }
  next();
};

export const attachInstructorScope = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== "INSTRUCTOR") {
      next();
      return;
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.user.userId },
      include: { subject: true },
    });

    if (!instructor) {
      res.status(404).json({ error: "Instructor profile not found" });
      return;
    }

    req.instructorScope = {
      id: instructor.id,
      subjectId: instructor.subjectId,
      stream: instructor.stream,
      subjectName: instructor.subject.name,
    };

    next();
  } catch {
    res.status(500).json({ error: "Failed to load instructor scope" });
  }
};

export const requireStudent = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "STUDENT") {
    res.status(403).json({ error: "Student access required" });
    return;
  }
  next();
};
