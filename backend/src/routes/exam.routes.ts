import { Router } from "express";
import { authenticate, requireStudent } from "../middleware/auth.middleware";
import * as examController from "../controllers/exam.controller";

const router = Router();

router.use(authenticate, requireStudent);

router.post("/verify-password", examController.verifyExamPassword);
router.post("/submit", examController.submitExam);
router.get("/attempt/:id", examController.getAttemptResult);
router.get("/years", examController.getExamYears);
router.get("/subjects", examController.getSubjectsByStream);

export default router;
