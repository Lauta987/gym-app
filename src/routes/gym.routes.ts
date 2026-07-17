import { Router } from "express";

import {
  createGym,
  deactivateGym,
  getGymById,
  getGyms,
  updateGym,
} from "../controllers/gym.controller";

import {
  authorizeRoles,
  protect,
} from "../middlewares/auth.middleware";

const router = Router();

router.use(protect);
router.use(authorizeRoles("superadmin"));

router.post("/", createGym);

router.get("/", getGyms);

router.get("/:id", getGymById);

router.put("/:id", updateGym);

router.delete("/:id", deactivateGym);

export default router; 