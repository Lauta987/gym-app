import { Router } from "express";

import {
  getGymManifest,
  getPublicGymBySlug,
} from "../controllers/publicGym.controller";

const router = Router();

router.get("/:slug/manifest.webmanifest", getGymManifest);
router.get("/:slug", getPublicGymBySlug);

export default router; 