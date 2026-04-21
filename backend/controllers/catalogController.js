import mongoose from "mongoose";
import { randomUUID } from "crypto";

import CatalogCourse from "../models/CatalogCourse.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Module from "../models/Module.js";
import Lesson from "../models/Lesson.js";

const isTruthyPublished = (value) => {
  if (value === true) return true;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    return ["published", "active", "true", "1", "available"].includes(
      value.trim().toLowerCase()
    );
  }

  return false;
};

const toNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const pickFirstString = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const normalizeCatalogCourse = (course) => {
  const rawId = course?._id;
  const contentCourseId = course?.contentCourseId
    || course?.internalCourseId
    || (course?.courseId && String(course.courseId) !== String(rawId) ? course.courseId : null);

  return {
    _id: String(rawId),
    title: pickFirstString(course?.title, course?.name, course?.courseName, "Untitled course"),
    description: pickFirstString(course?.description, course?.summary, course?.details),
    category: pickFirstString(course?.category, course?.specialization, course?.type, "General"),
    thumbnail: pickFirstString(course?.thumbnail, course?.thumbnailUrl, course?.image, course?.imageUrl),
    price: toNumber(course?.price ?? course?.amount ?? course?.courseFee ?? 0),
    status: pickFirstString(course?.status, isTruthyPublished(course?.isPublished) ? "published" : "draft"),
    isPublished: course?.status
      ? String(course.status).trim().toLowerCase() === "published"
      : isTruthyPublished(course?.isPublished),
    contentCourseId: contentCourseId ? String(contentCourseId) : null,
    source: "lms_payments.courses"
  };
};

const normalizeInternalCourse = (course) => ({
  _id: String(course?._id),
  title: pickFirstString(course?.title, "Untitled course"),
  description: pickFirstString(course?.description),
  category: pickFirstString(course?.category, "General"),
  thumbnail: pickFirstString(course?.thumbnail),
  price: toNumber(course?.price ?? 0),
  status: pickFirstString(course?.status, "draft"),
  isPublished: String(course?.status || "").trim().toLowerCase() === "published",
  contentCourseId: String(course?._id),
  source: "course_management"
});

const filterInternalCoursesBySearch = (courses, search) => {
  if (!search) {
    return courses;
  }

  const normalizedSearch = search.trim().toLowerCase();

  return courses.filter((course) => {
    const title = String(course.title || "").toLowerCase();
    const category = String(course.category || "").toLowerCase();
    const description = String(course.description || "").toLowerCase();

    return (
      title.includes(normalizedSearch)
      || category.includes(normalizedSearch)
      || description.includes(normalizedSearch)
    );
  });
};

const findCatalogOrInternalCourse = async (id) => {
  const selector = mongoose.Types.ObjectId.isValid(id)
    ? { _id: new mongoose.Types.ObjectId(id) }
    : { _id: id };

  const catalogCourse = await CatalogCourse.findOne(selector).lean();

  if (catalogCourse) {
    return normalizeCatalogCourse(catalogCourse);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const internalCourse = await Course.findById(id).lean();

  if (!internalCourse) {
    return null;
  }

  return normalizeInternalCourse(internalCourse);
};

const buildCourseContentPayload = async (courseId) => {
  const course = await Course.findById(courseId)
    .select("_id title description category thumbnail status price")
    .lean();

  if (!course) {
    return null;
  }

  const modules = await Module.find({ courseId })
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

  return {
    course,
    modules: modules.map((moduleItem) => ({
      _id: moduleItem._id,
      title: moduleItem.title,
      content: moduleItem.content,
      order: moduleItem.order,
      lessons: lessonsMap.get(String(moduleItem._id)) || []
    }))
  };
};

const buildPublishedFilter = () => ({
  $or: [
    { status: { $regex: /^published$/i } },
    { status: { $regex: /^active$/i } },
    { isPublished: true },
    { isPublished: 1 },
    { isActive: true }
  ]
});

export const getCatalogCourses = async (req, res) => {
  try {
    const search = String(req.query?.search || "").trim();
    const filter = buildPublishedFilter();

    if (search) {
      filter.$and = [
        {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { summary: { $regex: search, $options: "i" } },
            { category: { $regex: search, $options: "i" } },
            { specialization: { $regex: search, $options: "i" } }
          ]
        }
      ];
    }

    const [paymentCourses, internalCourses] = await Promise.all([
      CatalogCourse.find(filter).sort({ createdAt: -1 }).lean(),
      Course.find({ status: "published" }).sort({ createdAt: -1 }).lean()
    ]);

    const normalizedPaymentCourses = paymentCourses.map(normalizeCatalogCourse);
    const normalizedInternalCourses = filterInternalCoursesBySearch(
      internalCourses.map(normalizeInternalCourse),
      search
    );

    const mergedCourses = [...normalizedInternalCourses, ...normalizedPaymentCourses];

    return res.json({
      success: true,
      data: mergedCourses
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCatalogCourseById = async (req, res) => {
  try {
    const course = await findCatalogOrInternalCourse(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Catalog course not found"
      });
    }

    return res.json({
      success: true,
      data: course
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const purchaseCatalogCourse = async (req, res) => {
  try {
    const normalized = await findCatalogOrInternalCourse(req.params.id);

    if (!normalized) {
      return res.status(404).json({
        success: false,
        message: "Catalog course not found"
      });
    }

    if (!normalized.isPublished) {
      return res.status(400).json({
        success: false,
        message: "This course is not available for enrollment"
      });
    }

    const alreadyPurchased = Array.isArray(req.user?.purchasedCourses)
      && req.user.purchasedCourses.map(String).includes(String(normalized._id));

    if (alreadyPurchased) {
      return res.json({
        success: true,
        message: "Course already enrolled",
        data: {
          course: normalized,
          purchasedCourses: Array.isArray(req.user?.purchasedCourses)
            ? req.user.purchasedCourses
            : []
        }
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $addToSet: {
          purchasedCourses: normalized._id
        }
      },
      {
        new: true
      }
    ).lean();

    const numericPrice = toNumber(normalized.price);

    if (numericPrice > 0) {
      await Payment.create({
        transactionId: randomUUID(),
        userId: String(req.user?._id || ""),
        userName: pickFirstString(
          req.user?.name,
          req.user?.email ? String(req.user.email).split("@")[0] : "",
          "User"
        ),
        userEmail: pickFirstString(req.user?.email),
        courseId: String(normalized._id),
        courseName: normalized.title,
        amount: numericPrice,
        paymentStatus: "Success",
        paymentMethod: pickFirstString(req.body?.paymentMethod, "Card"),
        date: new Date()
      });
    }

    return res.json({
      success: true,
      message: "Course enrolled successfully",
      data: {
        course: normalized,
        purchasedCourses: Array.isArray(updatedUser?.purchasedCourses)
          ? updatedUser.purchasedCourses
          : []
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const disenrollCatalogCourse = async (req, res) => {
  try {
    const normalized = await findCatalogOrInternalCourse(req.params.id);

    if (!normalized) {
      return res.status(404).json({
        success: false,
        message: "Catalog course not found"
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: {
          purchasedCourses: normalized._id
        }
      },
      {
        new: true
      }
    ).lean();

    return res.json({
      success: true,
      message: "Course disenrolled successfully",
      data: {
        course: normalized,
        purchasedCourses: Array.isArray(updatedUser?.purchasedCourses)
          ? updatedUser.purchasedCourses
          : []
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getMyCatalogCourses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    const purchasedIds = Array.isArray(user?.purchasedCourses) ? user.purchasedCourses : [];

    if (purchasedIds.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const objectIds = purchasedIds
      .filter((value) => mongoose.Types.ObjectId.isValid(value))
      .map((value) => new mongoose.Types.ObjectId(value));

    const [paymentCourses, internalCourses] = await Promise.all([
      CatalogCourse.find({
        $or: [
          { _id: { $in: objectIds } },
          { _id: { $in: purchasedIds } }
        ]
      }).lean(),
      Course.find({
        _id: { $in: objectIds }
      }).lean()
    ]);

    return res.json({
      success: true,
      data: [
        ...internalCourses.map(normalizeInternalCourse),
        ...paymentCourses.map(normalizeCatalogCourse)
      ]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getPurchasedCatalogCourseContent = async (req, res) => {
  try {
    const normalized = await findCatalogOrInternalCourse(req.params.id);

    if (!normalized) {
      return res.status(404).json({
        success: false,
        message: "Catalog course not found"
      });
    }
    const purchasedIds = Array.isArray(req.user?.purchasedCourses) ? req.user.purchasedCourses : [];
    const hasAccess = req.user?.role === "admin" || purchasedIds.includes(normalized._id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Buy this course before accessing the content"
      });
    }

    const contentCourseId = normalized.contentCourseId || normalized._id;
    const payload = await buildCourseContentPayload(contentCourseId);

    if (!payload) {
      return res.json({
        success: true,
        data: {
          course: normalized,
          modules: []
        }
      });
    }

    return res.json({
      success: true,
      data: payload
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
