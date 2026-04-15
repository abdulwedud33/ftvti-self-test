import { Router } from "express";
import { authenticate, requireAdmin, requireAdminOrInstructor, attachInstructorScope } from "../middleware/auth.middleware";
import * as adminController from "../controllers/admin.controller";

const router = Router();

router.use(authenticate);

// Students
router.get("/students", requireAdmin, adminController.getStudents);
router.get("/students/:id", requireAdmin, adminController.getStudentDetail);
router.post("/students", requireAdmin, adminController.createStudent);
router.delete("/students/:id", requireAdmin, adminController.deleteStudent);

// Instructors
router.get("/instructors", requireAdmin, adminController.getInstructors);
router.post("/instructors", requireAdmin, adminController.createInstructor);
router.delete("/instructors/:id", requireAdmin, adminController.deleteInstructor);

// Subjects
router.get("/subjects", requireAdmin, adminController.getSubjects);
router.post("/subjects", requireAdmin, adminController.createSubject);
router.delete("/subjects/:id", requireAdmin, adminController.deleteSubject);


// Questions
router.get("/questions", requireAdminOrInstructor, attachInstructorScope, adminController.getQuestions);
router.post("/questions", requireAdminOrInstructor, attachInstructorScope, adminController.createQuestion);
router.put("/questions/:id", requireAdmin, adminController.updateQuestion);
router.delete("/questions/:id", requireAdminOrInstructor, attachInstructorScope, adminController.deleteQuestion);
router.get("/questions/years", requireAdmin, adminController.getQuestionYears);

// Events
router.get("/events", requireAdmin, adminController.getEvents);
router.post("/events", requireAdmin, adminController.createEvent);
router.delete("/events/:id", requireAdmin, adminController.deleteEvent);

// Exam Config
router.get("/exam-config", requireAdmin, adminController.getExamConfig);
router.put("/exam-config", requireAdmin, adminController.updateExamConfig);

// Results & Comments
router.get("/results", requireAdminOrInstructor, attachInstructorScope, adminController.getAllResults);
router.get("/comments", requireAdmin, adminController.getAllComments);
router.delete("/comments/:id", requireAdmin, adminController.deleteComment);

// Stats
router.get("/dashboard-stats", requireAdmin, adminController.getDashboardStats);

export default router;
