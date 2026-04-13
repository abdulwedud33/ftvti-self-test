import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.middleware";
import * as adminController from "../controllers/admin.controller";

const router = Router();

router.use(authenticate, requireAdmin);

// Students
router.get("/students", adminController.getStudents);
router.post("/students", adminController.createStudent);
router.delete("/students/:id", adminController.deleteStudent);

// Instructors
router.get("/instructors", adminController.getInstructors);
router.post("/instructors", adminController.createInstructor);
router.delete("/instructors/:id", adminController.deleteInstructor);

// Subjects
router.get("/subjects", adminController.getSubjects);
router.post("/subjects", adminController.createSubject);
router.delete("/subjects/:id", adminController.deleteSubject);

// Departments
router.get("/departments", adminController.getDepartments);

// Questions
router.get("/questions", adminController.getQuestions);
router.post("/questions", adminController.createQuestion);
router.delete("/questions/:id", adminController.deleteQuestion);
router.get("/questions/years", adminController.getQuestionYears);

// Events
router.get("/events", adminController.getEvents);
router.post("/events", adminController.createEvent);
router.delete("/events/:id", adminController.deleteEvent);

// Exam Config
router.get("/exam-config", adminController.getExamConfig);
router.put("/exam-config", adminController.updateExamConfig);

// Results & Comments
router.get("/results", adminController.getAllResults);
router.get("/comments", adminController.getAllComments);
router.delete("/comments/:id", adminController.deleteComment);

// Stats
router.get("/dashboard-stats", adminController.getDashboardStats);

export default router;
