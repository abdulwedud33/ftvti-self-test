import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../utils/prisma";

// [UPDATED] Added optional `year` to filter questions by exam year
const verifyPasswordSchema = z.object({
  password: z.string().min(1),
  year: z.number().int().optional(), // [NEW] filter questions by this year
});

/**
 * Verify exam password and return exam config + questions for a specific year.
 * [UPDATED] Now accepts optional `year` to filter questions.
 * [UPDATED] Now returns `correctAnswer` per question to enable during-exam feedback.
 */
export const verifyExamPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { password, year } = verifyPasswordSchema.parse(req.body);

    const config = await prisma.examConfig.findFirst({ where: { isActive: true } });
    if (!config) {
      res.status(404).json({ error: "No active exam configured" });
      return;
    }

    if (config.password !== password) {
      res.status(401).json({ error: "Incorrect exam password" });
      return;
    }

    // [UPDATED] Filter by year when provided
    const questions = await prisma.question.findMany({
      where: year ? { year } : undefined,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        questionText: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
        year: true,
        // [NEW] correctAnswer IS now sent to client to enable per-question feedback
        // after the student answers and clicks Next.
        correctAnswer: true,
      },
    });

    if (questions.length === 0) {
      res.status(400).json({
        error: year
          ? `No questions available for year ${year}`
          : "No questions available for the exam",
      });
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
});

/**
 * Submit exam answers, calculate score, save attempt.
 */
export const submitExam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { answers, startTime } = submitExamSchema.parse(req.body);

    const student = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
    if (!student) {
      res.status(404).json({ error: "Student profile not found" });
      return;
    }

    // Fetch all questions with correct answers for scoring
    const questionIds = Object.keys(answers);
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, correctAnswer: true, questionText: true, optionA: true, optionB: true, optionC: true, optionD: true },
    });

    // Calculate score
    let score = 0;
    const detailedResults: Record<string, {
      selected: string;
      correct: string;
      isCorrect: boolean;
      questionText: string;
      optionA: string; optionB: string; optionC: string; optionD: string;
    }> = {};

    for (const q of questions) {
      const selected = answers[q.id];
      const isCorrect = selected === q.correctAnswer;
      if (isCorrect) score++;
      detailedResults[q.id] = {
        selected,
        correct: q.correctAnswer,
        isCorrect,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
      };
    }

    // Save attempt
    const attempt = await prisma.examAttempt.create({
      data: {
        studentId: student.id,
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
      percentage: Math.round((score / questions.length) * 100),
      passed: score / questions.length >= 0.5,
      detailedResults,
      endTime: attempt.endTime,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error("Submit exam error:", error);
    res.status(500).json({ error: "Failed to submit exam" });
  }
};

/**
 * Get a specific exam attempt result (for review).
 */
export const getAttemptResult = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
    if (!student) { res.status(404).json({ error: "Student not found" }); return; }

    const attempt = await prisma.examAttempt.findFirst({
      where: { id: req.params.id, studentId: student.id },
    });
    if (!attempt) { res.status(404).json({ error: "Attempt not found" }); return; }

    res.json(attempt);
  } catch {
    res.status(500).json({ error: "Failed to fetch attempt" });
  }
};

/**
 * [NEW] Return distinct years available in the question bank, sorted descending.
 * Used by the student exam page to render year-based tabs.
 */
export const getExamYears = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await prisma.question.findMany({
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "desc" },
    });
    res.json(rows.map((r) => r.year));
  } catch {
    res.status(500).json({ error: "Failed to fetch exam years" });
  }
};
