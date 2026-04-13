import { Router } from "express";
import { authenticate, requireStudent } from "../middleware/auth.middleware";
import { getMyProfile, getMyResults, getEvents, submitFeedback } from "../controllers/student.controller";

const router = Router();
router.use(authenticate, requireStudent);

router.get("/profile", getMyProfile);
router.get("/results", getMyResults);
router.get("/events", getEvents);
router.get("/announcements", getEvents); // Alias for frontend compatibility
router.post("/feedback", submitFeedback);

export default router;
