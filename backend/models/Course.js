import mongoose from "mongoose";

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

export default mongoose.model("Course", courseSchema);