import { Router } from "express";
import {
  assignRoutineToStudent,
  createRoutine,
  getMyRoutine,
  getRoutineById,
  getRoutines,
} from "../controllers/routine.controller";
import { authorizeRoles, protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", protect, authorizeRoles("admin", "trainer"), createRoutine);

router.get("/", protect, authorizeRoles("admin", "trainer"), getRoutines);

router.get("/my-routine", protect, authorizeRoles("student"), getMyRoutine);

router.get("/:id", protect, getRoutineById);

router.put(
  "/:routineId/assign/:studentId",
  protect,
  authorizeRoles("admin", "trainer"),
  assignRoutineToStudent
);

export default router; 