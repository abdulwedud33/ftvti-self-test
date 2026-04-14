import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../utils/prisma";

export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.userId },
      include: { user: { select: { username: true, createdAt: true } } },
    });
    if (!student) { res.status(404).json({ error: "Student profile not found" }); return; }
    res.json(student);
  } catch {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

export const getMyResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
    if (!student) { res.status(404).json({ error: "Student not found" }); return; }

    const attempts = await prisma.examAttempt.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(attempts);
  } catch {
    res.status(500).json({ error: "Failed to fetch results" });
  }
};

export const getEvents = async (_req: Request, res: Response): Promise<void> => {
  try {
    const events = await prisma.event.findMany({ orderBy: { date: "asc" } });
    res.json(events);
  } catch {
    res.status(500).json({ error: "Failed to fetch events" });
  }
};

const feedbackSchema = z.object({
  message: z.string().min(5, "Feedback must be at least 5 characters"),
});

export const submitFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = feedbackSchema.parse(req.body);
    const student = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
    if (!student) { res.status(404).json({ error: "Student not found" }); return; }

    const comment = await prisma.comment.create({
      data: { studentId: student.id, message },
    });
    res.status(201).json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: "Failed to submit feedback" });
  }
};
