import mongoose from "mongoose";
import Course from "../models/Course.js";
import Module from "../models/Module.js";
import Lesson from "../models/Lesson.js";
import { updateOrder } from "../utils/updateOrder.js";
import { removeUploadedFilesFromLessons } from "../utils/fileCleanup.js";

// CREATE MODULE
export const createModule = async (req, res) => {
  try {
    const { title, content, courseId, order } = req.body;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid courseId is required" });
    }

    const course = await Course.findById(courseId).select("_id").lean();

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const module = new Module({
      title,
      content,
      courseId,
      order
    });

    await module.save();
    res.status(201).json({ success: true, data: module });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET MODULES BY COURSE
export const getModulesByCourse = async (req, res) => {
  try {
    const modules = await Module.find({ courseId: req.params.courseId })
      .select("_id title order content")
      .sort({ order: 1 });
    res.json({ success: true, data: modules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// REORDER MODULES
export const reorderModules = async (req, res) => {
  try {
    const { courseId, modules } = req.body;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid courseId is required" });
    }

    const course = await Course.findById(courseId).select("_id").lean();

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    if (!Array.isArray(modules) || modules.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "modules array is required" });
    }

    const moduleIds = modules.map((item) => item?.id).filter(Boolean);

    const scopedModules = await Module.find({
      _id: { $in: moduleIds },
      courseId
    })
      .select("_id")
      .lean();

    if (scopedModules.length !== moduleIds.length) {
      return res.status(400).json({
        success: false,
        message: "All modules must belong to the provided courseId"
      });
    }

    const result = await updateOrder({
      Model: Module,
      items: modules,
      entityName: "modules"
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

// UPDATE MODULE
export const updateModule = async (req, res) => {
  try {
    const module = await Module.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!module) {
      return res
        .status(404)
        .json({ success: false, message: "Module not found" });
    }
    res.json({ success: true, data: module });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE MODULE
export const deleteModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);

    if (!module) {
      return res
        .status(404)
        .json({ success: false, message: "Module not found" });
    }

    const lessons = await Lesson.find({ moduleId: module._id })
      .select("fileUrl")
      .lean();

    await removeUploadedFilesFromLessons(lessons);
    await Lesson.deleteMany({ moduleId: module._id });
    await Module.findByIdAndDelete(module._id);

    res.json({
      success: true,
      data: { message: "Module deleted successfully" }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
