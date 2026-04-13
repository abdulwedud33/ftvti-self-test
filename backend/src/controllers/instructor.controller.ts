import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../utils/prisma";

export const getInstructorDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.user!.userId },
      include: { subject: true },
    });

    if (!instructor) {
      res.status(404).json({ error: "Instructor profile not found" });
      return;
    }

    const [questionCount, attemptCount] = await Promise.all([
      prisma.question.count({ where: { subjectId: instructor.subjectId } }),
      prisma.examAttempt.count({ where: { subjectId: instructor.subjectId, isCompleted: true } }),
    ]);

    const recentResults = await prisma.examAttempt.findMany({
      where: { subjectId: instructor.subjectId, isCompleted: true },
      include: { student: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    res.json({
      instructor,
      stats: {
        questionCount,
        attemptCount,
      },
      recentResults,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch instructor dashboard" });
  }
};

export const getInstructorQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!instructor) {
      res.status(404).json({ error: "Instructor not found" });
      return;
    }

    const questions = await prisma.question.findMany({
      where: { subjectId: instructor.subjectId },
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
    });

    res.json(questions);
  } catch {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
};

export const getInstructorResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!instructor) {
      res.status(404).json({ error: "Instructor not found" });
      return;
    }

    const results = await prisma.examAttempt.findMany({
      where: { subjectId: instructor.subjectId, isCompleted: true },
      include: { student: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(results);
  } catch {
    res.status(500).json({ error: "Failed to fetch results" });
  }
};
