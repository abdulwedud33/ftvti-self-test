import { Router } from "express";
import { login, logout, me, updateProfile } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authenticate, me);
router.patch("/profile", authenticate, updateProfile);

export default router;
