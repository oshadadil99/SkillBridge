import mongoose from "mongoose";

import { getNamedDb } from "../config/db.js";

const skillbridgeDb = getNamedDb("skillbridge");

const courseSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  category: {
    type: String,
    required: true
  },

  thumbnail: {
    type: String
  },

  status: {
    type: String,
    enum: ["draft", "published"],
    default: "draft"
  },

  instructorId: {
    type: String
  },

  price: {
    type: Number,
    default: 0
  },

  isPaid: {
    type: Boolean,
    default: false
  },

  duration: {
    type: String
  },

  level: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"]
  }

}, {
  timestamps: true
});

export default skillbridgeDb.models.Course
  || skillbridgeDb.model("Course", courseSchema, "courses");
