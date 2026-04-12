import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../utils/prisma";

// ─── Students ─────────────────────────────────────────────────────────────────

const createStudentSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  fullName: z.string().min(2),
  studentId: z.string().min(3),
  departmentId: z.string().min(1),
});

export const getStudents = async (_req: Request, res: Response): Promise<void> => {
  try {
    const students = await prisma.student.findMany({
      include: { user: { select: { username: true, role: true, createdAt: true } }, department: true },
      orderBy: { department: { name: "asc" } },
    });
    res.json(students);
  } catch {
    res.status(500).json({ error: "Failed to fetch students" });
  }
};

export const createStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = createStudentSchema.parse(req.body);
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { username: data.username, password: hashedPassword, role: "STUDENT" },
      });
      const student = await tx.student.create({
        data: {
          userId: user.id,
          fullName: data.fullName,
          studentId: data.studentId,
          departmentId: data.departmentId,
        },
        include: { department: true },
      });
      return student;
    });

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: "Failed to create student" });
  }
};

export const deleteStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) { res.status(404).json({ error: "Student not found" }); return; }
    // Cascade deletes user (and student) via prisma schema
    await prisma.user.delete({ where: { id: student.userId } });
    res.json({ message: "Student deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete student" });
  }
};

// ─── Questions ────────────────────────────────────────────────────────────────

// [UPDATED] Added year field (integer, 2000–2100, default 2025)
const createQuestionSchema = z.object({
  questionText: z.string().min(5),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
  year: z.number().int().min(2000).max(2100).default(2025), // [NEW]
});

export const getQuestions = async (_req: Request, res: Response): Promise<void> => {
  try {
    // [UPDATED] Order by year desc, then createdAt desc for better organisation
    const questions = await prisma.question.findMany({
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
    });
    res.json(questions);
  } catch {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
};

export const createQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = createQuestionSchema.parse(req.body);
    const question = await prisma.question.create({
      data: { ...data, createdBy: req.user!.userId }, // year is now included from data
    });
    res.status(201).json(question);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: "Failed to create question" });
  }
};

export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.question.delete({ where: { id: req.params.id } });
    res.json({ message: "Question deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete question" });
  }
};

// [NEW] Return all distinct years from the question bank, sorted descending
export const getQuestionYears = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await prisma.question.findMany({
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "desc" },
    });
    res.json(rows.map((r) => r.year));
  } catch {
    res.status(500).json({ error: "Failed to fetch question years" });
  }
};

// ─── Events ───────────────────────────────────────────────────────────────────

const createEventSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(5),
  date: z.string().datetime(),
});

export const getEvents = async (_req: Request, res: Response): Promise<void> => {
  try {
    const events = await prisma.event.findMany({ orderBy: { date: "asc" } });
    res.json(events);
  } catch {
    res.status(500).json({ error: "Failed to fetch events" });
  }
};

export const createEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = createEventSchema.parse(req.body);
    const event = await prisma.event.create({
      data: { ...data, date: new Date(data.date), createdBy: req.user!.userId },
    });
    res.status(201).json(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: "Failed to create event" });
  }
};

export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.event.delete({ where: { id: req.params.id } });
    res.json({ message: "Event deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete event" });
  }
};

// ─── Exam Config ──────────────────────────────────────────────────────────────

const examConfigSchema = z.object({
  password: z.string().min(4),
  durationMins: z.number().int().min(5).max(300),
  isActive: z.boolean().optional(),
});

export const getExamConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await prisma.examConfig.findFirst({ where: { isActive: true } });
    res.json(config);
  } catch {
    res.status(500).json({ error: "Failed to fetch exam config" });
  }
};

export const updateExamConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = examConfigSchema.parse(req.body);
    const config = await prisma.examConfig.upsert({
      where: { id: "default-config" },
      update: data,
      create: { id: "default-config", ...data, createdBy: req.user!.userId },
    });
    res.json(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: "Failed to update exam config" });
  }
};

// ─── Results & Comments ───────────────────────────────────────────────────────

export const getAllResults = async (_req: Request, res: Response): Promise<void> => {
  try {
    const results = await prisma.examAttempt.findMany({
      include: { student: { include: { department: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(results);
  } catch {
    res.status(500).json({ error: "Failed to fetch results" });
  }
};

export const getAllComments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const comments = await prisma.comment.findMany({
      include: { student: { include: { department: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(comments);
  } catch {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.comment.delete({ where: { id: req.params.id } });
    res.json({ message: "Comment deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete comment" });
  }
};

export const getDepartments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });
    res.json(departments);
  } catch {
    res.status(500).json({ error: "Failed to fetch departments" });
  }
};

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [totalStudents, totalQuestions, totalAttempts, totalEvents] = await Promise.all([
      prisma.student.count(),
      prisma.question.count(),
      prisma.examAttempt.count({ where: { isCompleted: true } }),
      prisma.event.count(),
    ]);

    const recentAttempts = await prisma.examAttempt.findMany({
      where: { isCompleted: true },
      include: { student: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const avgScoreResult = await prisma.examAttempt.aggregate({
      where: { isCompleted: true },
      _avg: { score: true },
    });

    res.json({
      totalStudents,
      totalQuestions,
      totalAttempts,
      totalEvents,
      avgScore: Math.round(avgScoreResult._avg.score || 0),
      recentAttempts,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};
