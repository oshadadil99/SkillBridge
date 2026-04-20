import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";

import { pdfToWord, compressFile } from "../controllers/toolController.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const toolInputDir = path.join(__dirname, "..", "uploads", "documents", "tools", "input");
fs.ensureDirSync(toolInputDir);

const upload = multer({
	dest: toolInputDir,
	limits: {
		fileSize: 50 * 1024 * 1024
	}
});

router.post("/pdf-to-word", upload.single("file"), pdfToWord);
router.post("/compress-file", upload.single("file"), compressFile);

export default router;
