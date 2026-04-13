import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../utils/prisma";

const verifyPasswordSchema = z.object({
  password: z.string().min(1),
  subjectId: z.string().min(1),
  year: z.number().int().optional(),
});

export const verifyExamPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { password, subjectId, year } = verifyPasswordSchema.parse(req.body);

    const student = await prisma.student.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!student) {
      res.status(404).json({ error: "Student profile not found" });
      return;
    }

    const config = await prisma.examConfig.findFirst({ where: { isActive: true } });
    if (!config) {
      res.status(404).json({ error: "No active exam configured" });
      return;
    }

    // Check password based on student stream
    const correctPassword = student.stream === "NATURAL_SCIENCE" ? config.naturalPassword : config.socialPassword;
    if (correctPassword !== password) {
      res.status(401).json({ error: "Incorrect exam password for your stream" });
      return;
    }

    if (year === undefined) {
      res.json({
        message: "Password verified",
        durationMins: config.durationMins,
      });
      return;
    }

    const questions = await prisma.question.findMany({
      where: { subjectId, year },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        questionText: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
        year: true,
        correctAnswer: true,
      },
    });

    if (questions.length === 0) {
      res.status(400).json({ error: `No questions available for this subject and year` });
      return;
    }

    res.json({
      durationMins: config.durationMins,
      totalQuestions: questions.length,
      questions,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: "Failed to verify exam password" });
  }
};

const submitExamSchema = z.object({
  answers: z.record(z.string(), z.enum(["A", "B", "C", "D"])),
  startTime: z.string().datetime(),
  subjectId: z.string().optional(),
  year: z.number().optional(),
});

export const submitExam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { answers, startTime, subjectId, year } = submitExamSchema.parse(req.body);

    const student = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
    if (!student) {
      res.status(404).json({ error: "Student profile not found" });
      return;
    }

    const questionIds = Object.keys(answers);
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
    });

    let score = 0;
    const detailedResults: Record<string, any> = {};

    for (const q of questions) {
      const selected = answers[q.id];
      const isCorrect = selected === q.correctAnswer;
      if (isCorrect) score++;
      detailedResults[q.id] = {
        selected,
        correct: q.correctAnswer,
        isCorrect,
        questionText: q.questionText,
      };
    }

    const attempt = await prisma.examAttempt.create({
      data: {
        studentId: student.id,
        subjectId,
        year,
        startTime: new Date(startTime),
        endTime: new Date(),
        score,
        totalQuestions: questions.length,
        answers: answers as object,
        isCompleted: true,
      },
    });

    res.json({
      attemptId: attempt.id,
      score,
      totalQuestions: questions.length,
      percentage: Math.round((score / (questions.length || 1)) * 100),
      passed: (score / (questions.length || 1)) >= 0.5,
      detailedResults,
      endTime: attempt.endTime,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: "Failed to submit exam" });
  }
};

export const getAttemptResult = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
    if (!student) { res.status(404).json({ error: "Student not found" }); return; }

    const attempt = await prisma.examAttempt.findFirst({
      where: { id: req.params.id, studentId: student.id },
      include: { subject: true },
    });
    if (!attempt) { res.status(404).json({ error: "Attempt not found" }); return; }

    res.json(attempt);
  } catch {
    res.status(500).json({ error: "Failed to fetch attempt" });
  }
};

export const getExamYears = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subjectId } = req.query;
    if (!subjectId) {
       res.status(400).json({ error: "Subject ID is required" });
       return;
    }

    const rows = await prisma.question.findMany({
      where: { subjectId: String(subjectId) },
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "desc" },
    });
    res.json(rows.map((r) => r.year));
  } catch {
    res.status(500).json({ error: "Failed to fetch exam years" });
  }
};

export const getSubjectsByStream = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    const subjects = await prisma.subject.findMany({
      where: { stream: student.stream },
      orderBy: { name: "asc" },
    });
    res.json(subjects);
  } catch {
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
};
