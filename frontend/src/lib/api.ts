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

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ─── APIs ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (username: string, password: string) =>
    apiFetch("/auth/login", { method: "POST", body: { username, password } }),
  logout: () => apiFetch("/auth/logout", { method: "POST" }),
  me: () => apiFetch("/auth/me"),
};

export const adminApi = {
  stats: () => apiFetch<DashboardStats>("/admin/dashboard-stats"),
  
  // Students
  students: () => apiFetch<Student[]>("/admin/students"),
  studentDetail: (id: string) => apiFetch<StudentProfile>(`/admin/students/${id}`),
  createStudent: (data: CreateStudentData) =>
    apiFetch("/admin/students", { method: "POST", body: data }),
  deleteStudent: (id: string) =>
    apiFetch(`/admin/students/${id}`, { method: "DELETE" }),

  // Instructors
  instructors: () => apiFetch<Instructor[]>("/admin/instructors"),
  createInstructor: (data: CreateInstructorData) =>
    apiFetch("/admin/instructors", { method: "POST", body: data }),
  deleteInstructor: (id: string) =>
    apiFetch(`/admin/instructors/${id}`, { method: "DELETE" }),

  // Subjects
  subjects: () => apiFetch<Subject[]>("/admin/subjects"),
  createSubject: (data: { name: string; stream: Stream }) =>
    apiFetch("/admin/subjects", { method: "POST", body: data }),
  deleteSubject: (id: string) =>
    apiFetch(`/admin/subjects/${id}`, { method: "DELETE" }),

  // Questions
  questions: () => apiFetch<Question[]>("/admin/questions"),
  createQuestion: (data: CreateQuestionData) =>
    apiFetch("/admin/questions", { method: "POST", body: data }),
  deleteQuestion: (id: string) =>
    apiFetch(`/admin/questions/${id}`, { method: "DELETE" }),
  questionYears: () => apiFetch<number[]>("/admin/questions/years"),

  // Exam Config
  examConfig: () => apiFetch<ExamConfig>("/admin/exam-config"),
  updateExamConfig: (data: Partial<ExamConfig>) =>
    apiFetch<ExamConfig>("/admin/exam-config", { method: "PUT", body: data }),

  // Logs & Comments
  results: () => apiFetch<ExamAttempt[]>("/admin/results"),
  comments: () => apiFetch<Comment[]>("/admin/comments"),
  deleteComment: (id: string) =>
    apiFetch(`/admin/comments/${id}`, { method: "DELETE" }),

  // Events
  events: () => apiFetch<Event[]>("/admin/events"),
  createEvent: (data: CreateEventData) =>
    apiFetch("/admin/events", { method: "POST", body: data }),
  deleteEvent: (id: string) =>
    apiFetch(`/admin/events/${id}`, { method: "DELETE" }),
};

export const instructorApi = {
  dashboard: () => apiFetch<InstructorDashboardData>("/instructor/dashboard"),
  questions: () => apiFetch<Question[]>("/instructor/questions"),
  results: () => apiFetch<ExamAttempt[]>("/instructor/results"),
};

export const examApi = {
  getSubjects: () => apiFetch<Subject[]>("/exam/subjects"),
  getYears: (subjectId: string) => apiFetch<number[]>(`/exam/years?subjectId=${subjectId}`),
  verifyPassword: (password: string, subjectId: string, year?: number) =>
    apiFetch<ExamSession>("/exam/verify-password", { method: "POST", body: { password, subjectId, year } }),
  submit: (answers: Record<string, string>, startTime: string, subjectId: string, year: number) =>
    apiFetch<ExamResult>("/exam/submit", { method: "POST", body: { answers, startTime, subjectId, year } }),
};

// Compatibility for student pages
export const studentApi = {
  results: () => apiFetch<ExamAttempt[]>("/student/results"),
  events: () => apiFetch<Event[]>("/student/announcements"),
  submitFeedback: (message: string) =>
    apiFetch("/student/feedback", { method: "POST", body: { message } }),
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type Role = "ADMIN" | "STUDENT" | "INSTRUCTOR";
export type Stream = "NATURAL_SCIENCE" | "SOCIAL_SCIENCE";

export type Gender = "MALE" | "FEMALE";

export interface Subject {
  id: string;
  name: string;
  stream: Stream;
}

export interface User {
  id: string;
  username: string;
  role: Role;
  student?: Student;
  instructor?: Instructor;
}

export interface Student {
  id: string;
  userId: string;
  fullName: string;
  studentId: string;
  gender: Gender;
  stream: Stream;
  user?: { username: string; createdAt: string };
}

export interface Instructor {
  id: string;
  userId: string;
  subjectId: string;
  subject: Subject;
  stream: Stream;
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
  year: number;
  subjectId: string;
  subject?: Subject;
  createdAt: string;
}

export interface ExamQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  year: number;
  correctAnswer: string;
}

export interface ExamConfig {
  id: string;
  naturalPassword: string;
  socialPassword: string;
  durationMins: number;
  isActive: boolean;
}

export interface ExamAttempt {
  id: string;
  studentId: string;
  student?: Student;
  subjectId?: string;
  subject?: Subject;
  year?: number;
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
  detailedResults: Record<string, any>;
  endTime: string;
}

export interface Comment {
  id: string;
  studentId: string;
  student: Student;
  message: string;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface StudentProfile {
  student: Student;
  subjects: Subject[];
  examAttempts: ExamAttempt[];
}

export interface DashboardStats {
  totalStudents: number;
  totalQuestions: number;
  totalAttempts: number;
  totalInstructors: number;
  avgScore: number;
  recentAttempts: ExamAttempt[];
}

export interface InstructorDashboardData {
  instructor: Instructor;
  stats: {
    questionCount: number;
    attemptCount: number;
  };
  recentResults: ExamAttempt[];
}

export interface CreateStudentData {
  username: string;
  password: string;
  fullName: string;
  studentId: string;
  gender: Gender;
  stream: Stream;
}

export interface CreateInstructorData {
  username: string;
  password: string;
  fullName: string;
  stream: Stream;
  subjectId: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  date: string;
}

export interface CreateQuestionData {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  year: number;
  subjectId: string;
}
