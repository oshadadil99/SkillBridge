import mongoose from "mongoose";

import { getNamedDb } from "../config/db.js";

const skillbridgeDb = getNamedDb("skillbridge");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user"
    },
    permissions: {
      type: [String],
      default: []
    },
    purchasedCourses: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    strict: false
  }
);

export default skillbridgeDb.models.User || skillbridgeDb.model("User", userSchema, "users");
