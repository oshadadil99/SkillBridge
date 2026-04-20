import mongoose from "mongoose";
import Lesson from "../models/Lesson.js";
import Module from "../models/Module.js";
import { updateOrder } from "../utils/updateOrder.js";
import { removeUploadedFile } from "../utils/fileCleanup.js";

const getLessonValidationError = ({ contentType, content, fileUrl }) => {
  if (contentType === "text" && (!content || !String(content).trim())) {
    return "Lesson content is required when contentType is text";
  }

  if (
    ["video", "pdf", "document"].includes(contentType) &&
    (!fileUrl || !String(fileUrl).trim())
  ) {
    return "Lesson fileUrl is required when contentType is video, pdf, or document";
  }

  return null;
};

// CREATE LESSON
export const createLesson = async (req, res) => {
  try {
    const { title, moduleId, contentType, content, fileUrl, order } = req.body;

    if (!moduleId || !mongoose.Types.ObjectId.isValid(moduleId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid moduleId is required" });
    }

    const parentModule = await Module.findById(moduleId).select("_id").lean();

    if (!parentModule) {
      return res
        .status(404)
        .json({ success: false, message: "Module not found" });
    }

    const validationError = getLessonValidationError({
      contentType,
      content,
      fileUrl
    });

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const lesson = new Lesson({
      title,
      moduleId,
      contentType,
      content,
      fileUrl,
      order
    });

    await lesson.save();
    res.status(201).json({ success: true, data: lesson });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET LESSONS BY MODULE
export const getLessonsByModule = async (req, res) => {
  try {
    const lessons = await Lesson.find({ moduleId: req.params.moduleId }).sort({
      order: 1
    });
    res.json({ success: true, data: lessons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// REORDER LESSONS
export const reorderLessons = async (req, res) => {
  try {
    const { moduleId, lessons } = req.body;

    if (!moduleId || !mongoose.Types.ObjectId.isValid(moduleId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid moduleId is required" });
    }

    const parentModule = await Module.findById(moduleId).select("_id").lean();

    if (!parentModule) {
      return res
        .status(404)
        .json({ success: false, message: "Module not found" });
    }

    if (!Array.isArray(lessons) || lessons.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "lessons array is required" });
    }

    const lessonIds = lessons.map((item) => item?.id).filter(Boolean);

    const scopedLessons = await Lesson.find({
      _id: { $in: lessonIds },
      moduleId
    })
      .select("_id")
      .lean();

    if (scopedLessons.length !== lessonIds.length) {
      return res.status(400).json({
        success: false,
        message: "All lessons must belong to the provided moduleId"
      });
    }

    const result = await updateOrder({
      Model: Lesson,
      items: lessons,
      entityName: "lessons"
    });

    if (!result.success) {
      return res
        .status(result.statusCode)
        .json({ success: false, message: result.message });
    }

    return res.json({ success: true, message: result.message });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE LESSON
export const updateLesson = async (req, res) => {
  try {
    const existingLesson = await Lesson.findById(req.params.id);

    if (!existingLesson) {
      return res
        .status(404)
        .json({ success: false, message: "Lesson not found" });
    }

    const mergedPayload = {
      contentType: req.body.contentType ?? existingLesson.contentType,
      content: req.body.content ?? existingLesson.content,
      fileUrl: req.body.fileUrl ?? existingLesson.fileUrl
    };

    const validationError = getLessonValidationError(mergedPayload);

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, data: lesson });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE LESSON
export const deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res
        .status(404)
        .json({ success: false, message: "Lesson not found" });
    }

    await removeUploadedFile(lesson.fileUrl);
    await Lesson.findByIdAndDelete(lesson._id);

    res.json({
      success: true,
      data: { message: "Lesson deleted successfully" }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
