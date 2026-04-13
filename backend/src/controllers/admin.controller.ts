import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../utils/prisma";
import { Role, Stream } from "@prisma/client";

// ─── Students ─────────────────────────────────────────────────────────────────

const createStudentSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  fullName: z.string().min(2),
  studentId: z.string().min(3),
  departmentId: z.string().min(1),
  stream: z.nativeEnum(Stream),
});

export const getStudents = async (_req: Request, res: Response): Promise<void> => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: { select: { username: true, role: true, createdAt: true } },
        department: true,
      },
      orderBy: { user: { createdAt: "desc" } },
    });
    res.json(students);
  } catch {
    res.status(500).json({ error: "Failed to fetch students" });
  }
};

export const getStudentDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { username: true, createdAt: true } },
        department: true,
        examAttempts: {
          include: { subject: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    const subjects = await prisma.subject.findMany({
      where: { stream: student.stream },
      orderBy: { name: "asc" },
    });

    res.json({ student, subjects, examAttempts: student.examAttempts });
  } catch {
    res.status(500).json({ error: "Failed to fetch student details" });
  }
};

export const createStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = createStudentSchema.parse(req.body);
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { username: data.username, password: hashedPassword, role: Role.STUDENT },
      });
      const student = await tx.student.create({
        data: {
          userId: user.id,
          fullName: data.fullName,
          studentId: data.studentId,
          departmentId: data.departmentId,
          stream: data.stream,
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

// ─── Instructors ──────────────────────────────────────────────────────────────

const createInstructorSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  fullName: z.string().min(2), // We'll store this in User or add if needed. For now let's just use username as identifier.
  stream: z.nativeEnum(Stream),
  subjectId: z.string().min(1),
});

export const getInstructors = async (_req: Request, res: Response): Promise<void> => {
  try {
    const instructors = await prisma.instructor.findMany({
      include: {
        user: { select: { username: true, createdAt: true } },
        subject: true,
      },
      orderBy: { stream: "asc" },
    });
    res.json(instructors);
  } catch {
    res.status(500).json({ error: "Failed to fetch instructors" });
  }
};

export const createInstructor = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = createInstructorSchema.parse(req.body);
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: data.username,
          password: hashedPassword,
          role: Role.INSTRUCTOR,
        },
      });
      const instructor = await tx.instructor.create({
        data: {
          userId: user.id,
          stream: data.stream,
          subjectId: data.subjectId,
        },
        include: { subject: true },
      });
      return instructor;
    });

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: "Failed to create instructor" });
  }
};

export const deleteInstructor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const instructor = await prisma.instructor.findUnique({ where: { id } });
    if (!instructor) {
      res.status(404).json({ error: "Instructor not found" });
      return;
    }
    await prisma.user.delete({ where: { id: instructor.userId } });
    res.json({ message: "Instructor deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete instructor" });
  }
};

// ─── Subjects ─────────────────────────────────────────────────────────────────

const createSubjectSchema = z.object({
  name: z.string().min(2),
  stream: z.nativeEnum(Stream),
});

export const getSubjects = async (_req: Request, res: Response): Promise<void> => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: [{ stream: "asc" }, { name: "asc" }],
    });
    res.json(subjects);
  } catch {
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
};

export const createSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = createSubjectSchema.parse(req.body);
    const subject = await prisma.subject.create({
      data,
    });
    res.status(201).json(subject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: "Failed to create subject" });
  }
};

export const deleteSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.subject.delete({ where: { id: req.params.id } });
    res.json({ message: "Subject deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete subject" });
  }
};

// ─── Questions ────────────────────────────────────────────────────────────────

const createQuestionSchema = z.object({
  questionText: z.string().min(5),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
  year: z.number().int().min(2000).max(2100).default(2025),
  subjectId: z.string().min(1),
});

export const getQuestions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const questions = await prisma.question.findMany({
      include: { subject: true },
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
      data: { ...data, createdBy: req.user!.userId },
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
  naturalPassword: z.string().min(4),
  socialPassword: z.string().min(4),
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
      include: {
        student: { include: { department: true } },
        subject: true,
      },
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
    const [totalStudents, totalQuestions, totalAttempts, totalEvents, totalInstructors] = await Promise.all([
      prisma.student.count(),
      prisma.question.count(),
      prisma.examAttempt.count({ where: { isCompleted: true } }),
      prisma.event.count(),
      prisma.instructor.count(),
    ]);

    const recentAttempts = await prisma.examAttempt.findMany({
      where: { isCompleted: true },
      include: { student: true, subject: true },
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
      totalInstructors,
      avgScore: Math.round(avgScoreResult._avg.score || 0),
      recentAttempts,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};

export const deleteStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }
    await prisma.user.delete({ where: { id: student.userId } });
    res.json({ message: "Student deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete student" });
  }
};
