import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsRoot = path.resolve(path.join(__dirname, "..", "uploads"));

const getAbsoluteUploadPath = (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== "string") {
    return null;
  }

  const normalized = fileUrl.replace(/\\/g, "/");
  if (!normalized.startsWith("/uploads/")) {
    return null;
  }

  const relativePath = normalized.replace(/^\/uploads\//, "");
  const absolutePath = path.resolve(path.join(uploadsRoot, relativePath));

  if (!absolutePath.startsWith(uploadsRoot)) {
    return null;
  }

  return absolutePath;
};

export const removeUploadedFile = async (fileUrl) => {
  const absolutePath = getAbsoluteUploadPath(fileUrl);

  if (!absolutePath) {
    return;
  }

  if (await fs.pathExists(absolutePath)) {
    await fs.remove(absolutePath);
  }
};

export const removeUploadedFilesFromLessons = async (lessons = []) => {
  await Promise.all(
    lessons.map((lesson) => removeUploadedFile(lesson?.fileUrl))
  );
};
