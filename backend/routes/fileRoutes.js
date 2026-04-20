import express from "express";

import {
  uploadLessonFile,
  uploadThumbnail,
  deleteFile
} from "../controllers/fileController.js";
import { uploadLessonFileMiddleware, uploadThumbnailMiddleware } from "../middleware/uploadMiddleware.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload", requireAuth, requireRole("admin"), (req, res, next) => {
  uploadLessonFileMiddleware.single("file")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ success: false, message: "File size exceeds 50MB limit" });
    }

    return res.status(400).json({ success: false, message: error.message });
  });
}, uploadLessonFile);

router.post("/upload-thumbnail", requireAuth, requireRole("admin"), (req, res, next) => {
  uploadThumbnailMiddleware.single("thumbnail")(req, res, (error) => {
    if (!error) return next();

    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, message: "Image size exceeds 5MB limit" });
    }

    return res.status(400).json({ success: false, message: error.message });
  });
}, uploadThumbnail);

router.delete("/:filename", requireAuth, requireRole("admin"), deleteFile);

export default router;
