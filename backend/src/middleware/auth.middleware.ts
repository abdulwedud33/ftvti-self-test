import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
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

export const requireStudent = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "STUDENT") {
    res.status(403).json({ error: "Student access required" });
    return;
  }
  next();
};
