const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface FetchOptions extends Omit<RequestInit, "body"> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
}

export class ApiError extends Error {
  constructor(public message: string, public status?: number) {
    super(message);
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { body, ...rest } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...rest,
    body: body && typeof body === "object" ? JSON.stringify(body) : (body as BodyInit | null),
  });

  if (!res.ok) {
    let errMsg = "Request failed";
    try {
      const err = await res.json();
      errMsg = err.error || err.message || errMsg;
    } catch {}
    throw new ApiError(errMsg, res.status);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    apiFetch("/auth/login", { method: "POST", body: { username, password } }),
  logout: () => apiFetch("/auth/logout", { method: "POST" }),
  me: () => apiFetch("/auth/me"),
};

// Admin
export const adminApi = {
  stats: () => apiFetch("/admin/stats"),
  departments: () => apiFetch<Department[]>("/admin/departments"),

  students: () => apiFetch<Student[]>("/admin/students"),
  createStudent: (data: CreateStudentData) =>
    apiFetch("/admin/students", { method: "POST", body: data }),
  deleteStudent: (id: string) =>
    apiFetch(`/admin/students/${id}`, { method: "DELETE" }),

  questions: () => apiFetch<Question[]>("/admin/questions"),
  createQuestion: (data: CreateQuestionData) =>
    apiFetch("/admin/questions", { method: "POST", body: data }),
  deleteQuestion: (id: string) =>
    apiFetch(`/admin/questions/${id}`, { method: "DELETE" }),

  events: () => apiFetch<Event[]>("/admin/events"),
  createEvent: (data: CreateEventData) =>
    apiFetch("/admin/events", { method: "POST", body: data }),
  deleteEvent: (id: string) =>
    apiFetch(`/admin/events/${id}`, { method: "DELETE" }),

  examConfig: () => apiFetch<ExamConfig>("/admin/exam-config"),
  updateExamConfig: (data: { password: string; durationMins: number }) =>
    apiFetch("/admin/exam-config", { method: "PUT", body: data }),

  results: () => apiFetch<ExamAttempt[]>("/admin/results"),
  comments: () => apiFetch<Comment[]>("/admin/comments"),
  deleteComment: (id: string) =>
    apiFetch(`/admin/comments/${id}`, { method: "DELETE" }),
};

// Student
export const studentApi = {
  profile: () => apiFetch<Student>("/student/profile"),
  results: () => apiFetch<ExamAttempt[]>("/student/results"),
  events: () => apiFetch<Event[]>("/student/events"),
  submitFeedback: (message: string) =>
    apiFetch("/student/feedback", { method: "POST", body: { message } }),
};

// Exam
export const examApi = {
  verifyPassword: (password: string) =>
    apiFetch<ExamSession>("/exam/verify-password", { method: "POST", body: { password } }),
  submit: (answers: Record<string, string>, startTime: string) =>
    apiFetch<ExamResult>("/exam/submit", { method: "POST", body: { answers, startTime } }),
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Department { id: string; name: string; }

export interface Student {
  id: string;
  userId: string;
  fullName: string;
  studentId: string;
  departmentId: string;
  department: Department;
  user?: { username: string; createdAt: string };
}

export interface Question {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer?: string;
  createdAt: string;
}

export interface ExamQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface ExamConfig {
  id: string;
  password: string;
  durationMins: number;
  isActive: boolean;
}

export interface ExamAttempt {
  id: string;
  studentId: string;
  student?: Student;
  startTime: string;
  endTime?: string;
  score: number;
  totalQuestions: number;
  isCompleted: boolean;
  createdAt: string;
}

export interface ExamSession {
  durationMins: number;
  totalQuestions: number;
  questions: ExamQuestion[];
}

export interface ExamResult {
  attemptId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  detailedResults: Record<string, {
    selected: string;
    correct: string;
    isCorrect: boolean;
    questionText: string;
    optionA: string; optionB: string; optionC: string; optionD: string;
  }>;
}

export interface Comment {
  id: string;
  studentId: string;
  student: Student;
  message: string;
  createdAt: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalQuestions: number;
  totalAttempts: number;
  totalEvents: number;
  avgScore: number;
  recentAttempts: ExamAttempt[];
}

export interface CreateStudentData {
  username: string;
  password: string;
  fullName: string;
  studentId: string;
  departmentId: string;
}

export interface CreateQuestionData {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
}

export interface CreateEventData {
  title: string;
  description: string;
  date: string;
}
