import { Router } from "express";
import {
  login,
  register,
} from "../controllers/auth.controller";
import { loginLimiter } from "../middlewares/rateLimit.middlewares";
import { validateBody } from "../middlewares/validate.middleware";
import {
  loginSchema,
  registerSchema,
} from "../validators/auth.validator";

const router = Router();

router.post(
  "/register",
  validateBody(registerSchema),
  register
);

router.post(
  "/login",
  loginLimiter,
  validateBody(loginSchema),
  login
);

export default router; 