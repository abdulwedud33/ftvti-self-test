import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.middleware";
import {
  getStudents, createStudent, deleteStudent,
  getQuestions, createQuestion, deleteQuestion,
  getEvents, createEvent, deleteEvent,
  getExamConfig, updateExamConfig,
  getAllResults, getAllComments, deleteComment,
  getDepartments, getDashboardStats,
} from "../controllers/admin.controller";

const router = Router();
router.use(authenticate, requireAdmin);

// Dashboard
router.get("/stats", getDashboardStats);

// Departments
router.get("/departments", getDepartments);

// Students
router.get("/students", getStudents);
router.post("/students", createStudent);
router.delete("/students/:id", deleteStudent);

// Questions
router.get("/questions", getQuestions);
router.post("/questions", createQuestion);
router.delete("/questions/:id", deleteQuestion);

// Events
router.get("/events", getEvents);
router.post("/events", createEvent);
router.delete("/events/:id", deleteEvent);

// Exam Config
router.get("/exam-config", getExamConfig);
router.put("/exam-config", updateExamConfig);

// Results
router.get("/results", getAllResults);

// Comments/Feedback
router.get("/comments", getAllComments);
router.delete("/comments/:id", deleteComment);

export default router;
