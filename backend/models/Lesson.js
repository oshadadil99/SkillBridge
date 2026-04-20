import mongoose from "mongoose";

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

export default mongoose.model("Lesson", lessonSchema);
