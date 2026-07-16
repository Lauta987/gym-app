import { Router } from "express";
import {
  assignRoutineToStudent,
  createRoutine,
  deleteRoutine,
  getMyRoutine,
  getRoutineById,
  getRoutines,
  updateRoutine,
} from "../controllers/routine.controller";
import { authorizeRoles, protect } from "../middlewares/auth.middleware";

const router = Router();

router.post(
  "/",
  protect,
  authorizeRoles("admin", "trainer"),
  createRoutine
);

router.get(
  "/",
  protect,
  authorizeRoles("admin", "trainer"),
  getRoutines
);

router.get(
  "/my-routine",
  protect,
  authorizeRoles("student"),
  getMyRoutine
);

router.get(
  "/:id",
  protect,
  authorizeRoles("admin", "trainer"),
  getRoutineById
);

router.put(
  "/:id",
  protect,
  authorizeRoles("admin", "trainer"),
  updateRoutine
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("admin", "trainer"),
  deleteRoutine
);

router.put(
  "/:routineId/assign/:studentId",
  protect,
  authorizeRoles("admin", "trainer"),
  assignRoutineToStudent
);

export default router; 