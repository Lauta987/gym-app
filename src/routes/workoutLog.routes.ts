import { Router } from "express";
import {
  createWorkoutLog,
  getMyWorkoutLogs,
  getStudentWorkoutLogs,
} from "../controllers/workoutLog.controller";
import { authorizeRoles, protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", protect, authorizeRoles("student"), createWorkoutLog);

router.get("/my-logs", protect, authorizeRoles("student"), getMyWorkoutLogs);

router.get(
  "/student/:studentId",
  protect,
  authorizeRoles("admin", "trainer"),
  getStudentWorkoutLogs
);

export default router; 