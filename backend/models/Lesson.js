import mongoose from "mongoose";

import { getNamedDb } from "../config/db.js";

const skillbridgeDb = getNamedDb("skillbridge");

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true
    },
    contentType: {
      type: String,
      enum: ["video", "pdf", "document", "text"]
    },
    content: {
      type: String
    },
    fileUrl: {
      type: String
    },
    order: {
      type: Number
    }
  },
  {
    timestamps: true
  }
);

export default skillbridgeDb.models.Lesson
  || skillbridgeDb.model("Lesson", lessonSchema, "lessons");
