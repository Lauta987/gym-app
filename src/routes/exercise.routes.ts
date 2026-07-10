import { Router } from "express";
import {
  createExercise,
  deleteExercise,
  getExerciseById,
  getExercises,
  updateExercise,
} from "../controllers/exercise.controller";
import { authorizeRoles, protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", protect, authorizeRoles("admin", "trainer"), createExercise);

router.get("/", protect, getExercises);

router.get("/:id", protect, getExerciseById);

router.put("/:id", protect, authorizeRoles("admin", "trainer"), updateExercise);

router.delete(
  "/:id",
  protect,
  authorizeRoles("admin", "trainer"),
  deleteExercise
);

export default router; 