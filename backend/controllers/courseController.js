import Course from "../models/Course.js";
import Module from "../models/Module.js";
import Lesson from "../models/Lesson.js";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import { removeUploadedFilesFromLessons } from "../utils/fileCleanup.js";

const PUBLISH_VALIDATION_MESSAGE =
  "Course must contain at least one module and lesson before publishing";

const normalizeStatusInput = (status) => {
  if (typeof status !== "string") {
    return status;
  }

  const normalized = status.trim().toLowerCase();

  if (normalized === "published") {
    return "published";
  }

  if (normalized === "draft") {
    return "draft";
  }

  return status;
};

const validateCourseForPublish = async (courseId) => {
  const modules = await Module.find({ courseId }).select("_id").lean();

  if (modules.length === 0) {
    return false;
  }

  const moduleIds = modules.map((moduleItem) => moduleItem._id);

  const lessonCountByModule = await Lesson.aggregate([
    {
      $match: {
        moduleId: { $in: moduleIds }
      }
    },
    {
      $group: {
        _id: "$moduleId",
        count: { $sum: 1 }
      }
    }
  ]);

  return lessonCountByModule.length === moduleIds.length;
};

// CREATE COURSE
export const createCourse = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      instructorId: req.body.instructorId || req.user?._id,
      status: normalizeStatusInput(req.body.status)
    };

    const course = new Course(payload);
    await course.save();
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET ALL COURSES
export const getCourses = async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const filters = {};

    if (typeof status === "string") {
      const normalizedStatus = normalizeStatusInput(status);

      if (["draft", "published"].includes(normalizedStatus)) {
        filters.status = normalizedStatus;
      }
    }

    if (typeof category === "string" && category.trim()) {
      filters.category = { $regex: `^${category.trim()}$`, $options: "i" };
    }

    if (typeof search === "string" && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      filters.$or = [
        { title: searchRegex },
        { category: searchRegex },
        { description: searchRegex }
      ];
    }

    const courses = await Course.find(filters).sort({ createdAt: -1 });
    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET COURSE BY ID
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE COURSE
export const updateCourse = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      status: normalizeStatusInput(req.body.status)
    };

    if (payload.status === "published") {
      const canPublish = await validateCourseForPublish(req.params.id);

      if (!canPublish) {
        return res
          .status(400)
          .json({ success: false, message: PUBLISH_VALIDATION_MESSAGE });
      }
    }

    const course = await Course.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE COURSE
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const courseId = String(course._id);

    const [enrolledUser, paymentRecord] = await Promise.all([
      User.findOne({
        purchasedCourses: courseId
      })
        .select("name email")
        .lean(),
      Payment.findOne({
        courseId,
        paymentStatus: "Success"
      })
        .select("transactionId userEmail")
        .lean()
    ]);

    if (enrolledUser || paymentRecord) {
      return res.status(409).json({
        success: false,
        message: "This course cannot be deleted because a user is already enrolled in it."
      });
    }

    const modules = await Module.find({ courseId: course._id }).select("_id").lean();
    const moduleIds = modules.map((moduleItem) => moduleItem._id);

    const lessons = moduleIds.length
      ? await Lesson.find({ moduleId: { $in: moduleIds } })
          .select("fileUrl")
          .lean()
      : [];

    await removeUploadedFilesFromLessons(lessons);

    if (moduleIds.length) {
      await Module.deleteMany({ _id: { $in: moduleIds } });
      await Lesson.deleteMany({ moduleId: { $in: moduleIds } });
    }

    await Course.findByIdAndDelete(course._id);

    res.json({
      success: true,
      data: { message: "Course deleted successfully" }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET FULL COURSE STRUCTURE
export const getCourseFullStructure = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .select("_id title description category thumbnail status price")
      .lean();

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const modules = await Module.find({ courseId: req.params.id })
      .select("_id title order content")
      .sort({ order: 1 })
      .lean();

    const moduleIds = modules.map((moduleItem) => moduleItem._id);

    const lessons = moduleIds.length
      ? await Lesson.find({ moduleId: { $in: moduleIds } })
          .select("_id title contentType content fileUrl order moduleId")
          .sort({ order: 1 })
          .lean()
      : [];

    const lessonsMap = new Map();

    lessons.forEach((lesson) => {
      const moduleId = String(lesson.moduleId);

      if (!lessonsMap.has(moduleId)) {
        lessonsMap.set(moduleId, []);
      }

      lessonsMap.get(moduleId).push({
        _id: lesson._id,
        title: lesson.title,
        contentType: lesson.contentType,
        content: lesson.content,
        fileUrl: lesson.fileUrl,
        order: lesson.order
      });
    });

    const modulesWithLessons = modules.map((moduleItem) => ({
      _id: moduleItem._id,
      title: moduleItem.title,
      content: moduleItem.content,
      order: moduleItem.order,
      lessons: lessonsMap.get(String(moduleItem._id)) || []
    }));

    return res.json({
      success: true,
      data: {
        course,
        modules: modulesWithLessons
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET LIGHT COURSE STRUCTURE
export const getCourseStructure = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).select("_id").lean();

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const modules = await Module.find({ courseId: req.params.id })
      .select("_id")
      .sort({ order: 1 })
      .lean();

    const moduleIds = modules.map((moduleItem) => moduleItem._id);

    const lessons = moduleIds.length
      ? await Lesson.find({ moduleId: { $in: moduleIds } })
          .select("_id moduleId")
          .sort({ order: 1 })
          .lean()
      : [];

    const lessonIdsByModule = new Map();

    lessons.forEach((lesson) => {
      const moduleId = String(lesson.moduleId);

      if (!lessonIdsByModule.has(moduleId)) {
        lessonIdsByModule.set(moduleId, []);
      }

      lessonIdsByModule.get(moduleId).push(lesson._id);
    });

    const structure = modules.map((moduleItem) => ({
      moduleId: moduleItem._id,
      lessonIds: lessonIdsByModule.get(String(moduleItem._id)) || []
    }));

    return res.json({
      success: true,
      data: {
        courseId: course._id,
        modules: structure
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
