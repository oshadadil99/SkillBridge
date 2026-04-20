import express from "express";

import {
  createModule,
  getModulesByCourse,
  reorderModules,
  updateModule,
  deleteModule
} from "../controllers/moduleController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", requireAuth, requireRole("admin"), createModule);

router.put("/reorder", requireAuth, requireRole("admin"), reorderModules);

router.get("/:courseId", getModulesByCourse);

router.put("/:id", requireAuth, requireRole("admin"), updateModule);

router.delete("/:id", requireAuth, requireRole("admin"), deleteModule);

export default router;
