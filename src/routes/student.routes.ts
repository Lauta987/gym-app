import { Router } from "express";
import {
  createStudent,
  deactivateStudent,
  getStudentById,
  getStudents,
  updateStudent,
} from "../controllers/student.controller";
import { authorizeRoles, protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", protect, authorizeRoles("admin", "trainer"), createStudent);

router.get("/", protect, authorizeRoles("admin", "trainer"), getStudents);

router.get("/:id", protect, authorizeRoles("admin", "trainer"), getStudentById);

router.put("/:id", protect, authorizeRoles("admin", "trainer"), updateStudent);

router.delete(
  "/:id",
  protect,
  authorizeRoles("admin", "trainer"),
  deactivateStudent
);

export default router; 