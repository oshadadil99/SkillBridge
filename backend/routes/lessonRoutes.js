import express from "express";

import {
  createLesson,
  getLessonsByModule,
  reorderLessons,
  updateLesson,
  deleteLesson
} from "../controllers/lessonController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", requireAuth, requireRole("admin"), createLesson);

router.put("/reorder", requireAuth, requireRole("admin"), reorderLessons);

router.get("/:moduleId", getLessonsByModule);

router.put("/:id", requireAuth, requireRole("admin"), updateLesson);

router.delete("/:id", requireAuth, requireRole("admin"), deleteLesson);

export default router;
