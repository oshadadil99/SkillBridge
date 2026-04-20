import express from "express";

import {
  getCatalogCourseById,
  getCatalogCourses,
  getMyCatalogCourses,
  getPurchasedCatalogCourseContent,
  purchaseCatalogCourse
} from "../controllers/catalogController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/courses", getCatalogCourses);
router.get("/courses/:id", getCatalogCourseById);
router.get("/courses/:id/content", requireAuth, getPurchasedCatalogCourseContent);
router.post("/courses/:id/purchase", requireAuth, purchaseCatalogCourse);
router.get("/my-courses", requireAuth, getMyCatalogCourses);

export default router;
