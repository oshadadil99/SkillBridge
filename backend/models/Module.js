import mongoose from "mongoose";

import { getNamedDb } from "../config/db.js";

const skillbridgeDb = getNamedDb("skillbridge");

const moduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    content: {
      type: String
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    order: {
      type: Number
    }
  },
  {
    timestamps: true
  }
);

export default skillbridgeDb.models.Module
  || skillbridgeDb.model("Module", moduleSchema, "modules");
