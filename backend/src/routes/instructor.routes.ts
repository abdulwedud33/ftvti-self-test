import { Router } from "express";
import { authenticate, requireInstructor } from "../middleware/auth.middleware";
import * as instructorController from "../controllers/instructor.controller";

const router = Router();

router.use(authenticate, requireInstructor);

router.get("/dashboard", instructorController.getInstructorDashboard);
router.get("/questions", instructorController.getInstructorQuestions);
router.get("/results", instructorController.getInstructorResults);

export default router;
