import mongoose from "mongoose";

import { getNamedDb } from "../config/db.js";

const paymentsDb = getNamedDb("lms_payments");

const catalogCourseSchema = new mongoose.Schema(
  {
    title: String,
    name: String,
    description: String,
    summary: String,
    category: String,
    price: mongoose.Schema.Types.Mixed,
    amount: mongoose.Schema.Types.Mixed,
    status: String,
    isPublished: mongoose.Schema.Types.Mixed,
    thumbnail: String,
    image: String,
    thumbnailUrl: String,
    courseId: mongoose.Schema.Types.Mixed,
    contentCourseId: mongoose.Schema.Types.Mixed,
    internalCourseId: mongoose.Schema.Types.Mixed
  },
  {
    timestamps: true,
    strict: false
  }
);

export default paymentsDb.models.CatalogCourse
  || paymentsDb.model("CatalogCourse", catalogCourseSchema, "courses");
