import express from "express";

import {
  createCourse,
  getCourses,
  getCourseById,
  getCourseFullStructure,
  getCourseStructure,
  updateCourse,
  deleteCourse
} from "../controllers/courseController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();


router.post("/", requireAuth, requireRole("admin"), createCourse);

router.get("/", getCourses);

router.get("/:id/full", getCourseFullStructure);

router.get("/:id/structure", getCourseStructure);

router.get("/:id", getCourseById);

router.put("/:id", requireAuth, requireRole("admin"), updateCourse);

router.delete("/:id", requireAuth, requireRole("admin"), deleteCourse);


export default router;
