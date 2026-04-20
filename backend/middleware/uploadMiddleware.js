import multer from "multer";
import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "..", "uploads");
const videosDir = path.join(uploadsDir, "videos");
const documentsDir = path.join(uploadsDir, "documents");
const thumbnailsDir = path.join(uploadsDir, "thumbnails");

fs.ensureDirSync(videosDir);
fs.ensureDirSync(documentsDir);
fs.ensureDirSync(thumbnailsDir);

const videoExtensions = new Set([".mp4", ".mov"]);
const documentExtensions = new Set([".pdf", ".doc", ".docx"]);
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);

const getFileCategory = (file) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (videoExtensions.has(extension)) {
    return "video";
  }

  if (documentExtensions.has(extension)) {
    return "document";
  }

  return null;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = getFileCategory(file);

    if (category === "video") {
      return cb(null, videosDir);
    }

    if (category === "document") {
      return cb(null, documentsDir);
    }

    return cb(
      new Error("Invalid file type. Allowed: mp4, mov, pdf, doc, docx.")
    );
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${extension}`);
  }
});

const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, thumbnailsDir),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const category = getFileCategory(file);

  if (!category) {
    return cb(
      new Error("Invalid file type. Allowed: mp4, mov, pdf, doc, docx."),
      false
    );
  }

  req.fileCategory = category;
  cb(null, true);
};

const thumbnailFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!imageExtensions.has(ext)) {
    return cb(new Error("Invalid image type. Allowed: png, jpg, jpeg, webp."), false);
  }

  req.fileCategory = "thumbnail";
  cb(null, true);
};

export const uploadLessonFileMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

export const uploadThumbnailMiddleware = multer({
  storage: thumbnailStorage,
  fileFilter: thumbnailFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});
