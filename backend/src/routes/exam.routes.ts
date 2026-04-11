import { Router } from "express";
import { authenticate, requireStudent } from "../middleware/auth.middleware";
import { verifyExamPassword, submitExam, getAttemptResult } from "../controllers/exam.controller";

const router = Router();
router.use(authenticate, requireStudent);

router.post("/verify-password", verifyExamPassword);
router.post("/submit", submitExam);
router.get("/attempt/:id", getAttemptResult);

export default router;
