import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import prisma from "../utils/prisma";
import { Role, Stream, Gender, SubjectType } from "@prisma/client";

// ─── Students ─────────────────────────────────────────────────────────────────

const createStudentSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  fullName: z
    .string()
    .trim()
    .min(2)
    .refine((value) => value.split(/\s+/).length >= 2, {
      message: "Please enter at least name and father name",
    }),
  studentId: z.string().min(3),
  gender: z.nativeEnum(Gender),
  stream: z.nativeEnum(Stream),
});

export const getStudents = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stream =
      typeof _req.query.stream === "string" && Object.values(Stream).includes(_req.query.stream as Stream)
        ? (_req.query.stream as Stream)
        : undefined;

    const students = await prisma.student.findMany({
      where: stream ? { stream } : undefined,
      include: {
        user: { select: { username: true, role: true, createdAt: true } },
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
      where: {
        OR: [
          { type: SubjectType.SHARED },
          { type: SubjectType.STREAM_SPECIFIC, stream: student.stream },
        ],
      },
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
          fullName: data.fullName.replace(/\s+/g, " ").trim(),
          studentId: data.studentId,
          gender: data.gender,
          stream: data.stream,
        },
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
    const stream =
      typeof _req.query.stream === "string" && Object.values(Stream).includes(_req.query.stream as Stream)
        ? (_req.query.stream as Stream)
        : undefined;

    const instructors = await prisma.instructor.findMany({
      where: stream ? { stream } : undefined,
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
    const subject = await prisma.subject.findUnique({ where: { id: data.subjectId } });
    if (!subject) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }

    if (subject.type === SubjectType.STREAM_SPECIFIC && subject.stream !== data.stream) {
      res.status(400).json({ error: "Selected subject does not match the instructor stream" });
      return;
    }

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

const createSubjectSchema = z
  .object({
    name: z.string().min(2),
    type: z.nativeEnum(SubjectType).default(SubjectType.STREAM_SPECIFIC),
    stream: z.nativeEnum(Stream).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === SubjectType.STREAM_SPECIFIC && !data.stream) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Stream is required for stream-specific subjects" });
    }
    if (data.type === SubjectType.SHARED && data.stream !== undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Shared subjects must not have a stream" });
    }
  });

export const getSubjects = async (_req: Request, res: Response): Promise<void> => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: [{ type: "asc" }, { stream: "asc" }, { name: "asc" }],
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
      data: {
        name: data.name,
        type: data.type,
        stream: data.type === SubjectType.SHARED ? null : data.stream,
      },
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
  subjectId: z.string().min(1).optional(),
});

export const getQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const stream =
      typeof req.query.stream === "string" && Object.values(Stream).includes(req.query.stream as Stream)
        ? (req.query.stream as Stream)
        : undefined;
    const subjectId = typeof req.query.subjectId === "string" ? req.query.subjectId : undefined;

    const where: Prisma.QuestionWhereInput = {};

    if (req.user?.role === "INSTRUCTOR" && req.instructorScope) {
      where.subjectId = req.instructorScope.subjectId;
    } else {
      if (stream) {
        where.OR = [
          { subject: { type: SubjectType.SHARED } },
          { subject: { type: SubjectType.STREAM_SPECIFIC, stream } },
        ];
      }
      if (subjectId) where.subjectId = subjectId;
    }

    const questions = await prisma.question.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
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

    let subjectId = data.subjectId;

    if (req.user?.role === "INSTRUCTOR") {
      const scope = req.instructorScope;
      if (!scope) {
        res.status(404).json({ error: "Instructor profile not found" });
        return;
      }

      if (data.subjectId && data.subjectId !== scope.subjectId) {
        res.status(403).json({ error: "You can only add questions for your assigned subject" });
        return;
      }

      subjectId = scope.subjectId;
    }

    if (!subjectId) {
      res.status(400).json({ error: "Subject is required" });
      return;
    }

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      res.status(400).json({ error: "Invalid subject selected" });
      return;
    }

    if (req.user?.role === "INSTRUCTOR") {
      const scope = req.instructorScope;
      if (!scope) {
        res.status(404).json({ error: "Instructor profile not found" });
        return;
      }

      if (subject.type === SubjectType.STREAM_SPECIFIC && subject.stream !== scope.stream) {
        res.status(403).json({ error: "You can only add questions for your assigned stream" });
        return;
      }
    }

    const question = await prisma.question.create({
      data: {
        ...data,
        subjectId,
        createdBy: req.user!.userId,
      },
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

const updateQuestionSchema = z.object({
  questionText: z.string().min(5),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
  year: z.number().int().min(2000).max(2100),
  subjectId: z.string().min(1),
});

export const updateQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = updateQuestionSchema.parse(req.body);
    const question = await prisma.question.findUnique({
      where: { id: req.params.id },
      include: { subject: true },
    });

    if (!question) {
      res.status(404).json({ error: "Question not found" });
      return;
    }

    const subject = await prisma.subject.findUnique({ where: { id: data.subjectId } });
    if (!subject) {
      res.status(400).json({ error: "Invalid subject selected" });
      return;
    }

    const updated = await prisma.question.update({
      where: { id: req.params.id },
      data: {
        questionText: data.questionText,
        optionA: data.optionA,
        optionB: data.optionB,
        optionC: data.optionC,
        optionD: data.optionD,
        correctAnswer: data.correctAnswer,
        year: data.year,
        subjectId: data.subjectId,
      },
      include: { subject: true },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: "Failed to update question" });
  }
};

export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role === "INSTRUCTOR") {
      const scope = req.instructorScope;
      if (!scope) {
        res.status(404).json({ error: "Instructor profile not found" });
        return;
      }

      const question = await prisma.question.findUnique({
        where: { id: req.params.id },
        include: { subject: true },
      });

      if (!question) {
        res.status(404).json({ error: "Question not found" });
        return;
      }

      if (question.subjectId !== scope.subjectId) {
        res.status(403).json({ error: "You can only delete questions from your assigned subject and stream" });
        return;
      }
    }

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

export const getAllResults = async (req: Request, res: Response): Promise<void> => {
  try {
    let where: Prisma.ExamAttemptWhereInput | undefined;
    if (req.user?.role === "INSTRUCTOR" && req.instructorScope) {
      where = {
        isCompleted: true,
        subjectId: req.instructorScope.subjectId,
      };

      if (req.instructorScope.subjectType === SubjectType.STREAM_SPECIFIC) {
        where.student = { stream: req.instructorScope.stream };
      }
    }

    const results = await prisma.examAttempt.findMany({
      where,
      include: {
        student: true,
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
      include: { student: true },
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
    
    // Delete related records first to avoid cascade constraint violations
    await prisma.examAttempt.deleteMany({ where: { studentId: id } });
    await prisma.comment.deleteMany({ where: { studentId: id } });
    
    // Delete the student record
    await prisma.student.delete({ where: { id } });
    
    // Finally, delete the user account
    await prisma.user.delete({ where: { id: student.userId } });
    res.json({ message: "Student deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error?.message ?? "Failed to delete student" });
  }
};
