import mongoose from "mongoose";

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

export default mongoose.model("Module", moduleSchema);
