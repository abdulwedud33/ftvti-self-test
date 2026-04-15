import { Request, Response } from "express";
import { z } from "zod";
import { SubjectType } from "@prisma/client";
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

    const isSharedSubject = instructor.subject.type === SubjectType.SHARED;
    const studentScope = isSharedSubject ? undefined : { stream: instructor.stream };
    const subjectStreamScope = isSharedSubject ? undefined : { stream: instructor.stream };

    const [questionCount, attemptCount] = await Promise.all([
      prisma.question.count({
        where: {
          subjectId: instructor.subjectId,
          subject: subjectStreamScope,
        },
      }),
      prisma.examAttempt.count({
        where: {
          subjectId: instructor.subjectId,
          isCompleted: true,
          subject: subjectStreamScope,
          student: studentScope,
        },
      }),
    ]);

    const recentResults = await prisma.examAttempt.findMany({
      where: {
        subjectId: instructor.subjectId,
        isCompleted: true,
        subject: subjectStreamScope,
        student: studentScope,
      },
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
      include: { subject: true },
    });

    if (!instructor) {
      res.status(404).json({ error: "Instructor not found" });
      return;
    }

    const isSharedSubject = instructor.subject.type === SubjectType.SHARED;
    const questions = await prisma.question.findMany({
      where: {
        subjectId: instructor.subjectId,
        subject: isSharedSubject ? undefined : { stream: instructor.stream },
      },
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
      include: { subject: true },
    });

    if (!instructor) {
      res.status(404).json({ error: "Instructor not found" });
      return;
    }

    const isSharedSubject = instructor.subject.type === SubjectType.SHARED;
    const results = await prisma.examAttempt.findMany({
      where: {
        subjectId: instructor.subjectId,
        isCompleted: true,
        subject: isSharedSubject ? undefined : { stream: instructor.stream },
        student: isSharedSubject ? undefined : { stream: instructor.stream },
      },
      include: { student: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(results);
  } catch {
    res.status(500).json({ error: "Failed to fetch results" });
  }
};
