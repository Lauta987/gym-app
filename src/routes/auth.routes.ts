import { Router } from "express";
import { getProfile, login, register } from "../controllers/auth.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", protect, getProfile);

export default router; 