import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "..", "uploads");
const videosDir = path.join(uploadsDir, "videos");
const documentsDir = path.join(uploadsDir, "documents");
const thumbnailsDir = path.join(uploadsDir, "thumbnails");

const getRelativeFilePath = (file, category) => {
  let folder = "documents";
  if (category === "video") folder = "videos";
  if (category === "thumbnail") folder = "thumbnails";
  return `/uploads/${folder}/${file.filename}`;
};

const findFileByName = async (filename) => {
  const safeName = path.basename(filename);

  const videoPath = path.join(videosDir, safeName);
  if (await fs.pathExists(videoPath)) {
    return videoPath;
  }

  const documentPath = path.join(documentsDir, safeName);
  if (await fs.pathExists(documentPath)) {
    return documentPath;
  }

  return null;
};

export const uploadLessonFile = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "File is required" });
    }

    const category = req.fileCategory || "document";
    const fileUrl = getRelativeFilePath(req.file, category);

    return res.status(201).json({
      success: true,
      data: {
        fileUrl,
        filename: req.file.filename,
        contentType: category
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "File is required" });
    }

    const fileUrl = getRelativeFilePath(req.file, "thumbnail");

    return res.status(201).json({
      success: true,
      fileUrl,
      data: {
        fileUrl,
        filename: req.file.filename,
        contentType: "thumbnail"
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = await findFileByName(filename);

    if (!filePath) {
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }

    await fs.remove(filePath);

    return res.json({
      success: true,
      data: {
        filename,
        message: "File deleted successfully"
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
