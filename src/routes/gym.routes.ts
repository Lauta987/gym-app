import { Router } from "express";

import {
  createGym,
  createGymAdmin,
  deactivateGym,
  getGymAdmins,
  getGymById,
  getGyms,
  resetGymAdminPassword,
  updateGym,
  updateGymAdminStatus,
} from "../controllers/gym.controller";

import {
  authorizeRoles,
  protect,
} from "../middlewares/auth.middleware";

const router = Router();

router.use(protect);
router.use(authorizeRoles("superadmin"));

router.get("/", getGyms);
router.post("/", createGym);

/*
 * Administradores del gimnasio.
 * Estas rutas deben estar antes de router.get("/:id").
 */
router.get("/:id/admins", getGymAdmins);
router.post("/:id/admins", createGymAdmin);

router.patch(
  "/:id/admins/:adminId/status",
  updateGymAdminStatus
);

router.patch(
  "/:id/admins/:adminId/password",
  resetGymAdminPassword
);

/*
 * Gestión general del gimnasio.
 */
router.get("/:id", getGymById);
router.put("/:id", updateGym);
router.delete("/:id", deactivateGym);

export default router; 