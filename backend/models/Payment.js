import mongoose from "mongoose";

import { getNamedDb } from "../config/db.js";

const paymentsDb = getNamedDb("lms_payments");

const paymentSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      trim: true
    },
    userId: {
      type: String,
      trim: true
    },
    userName: {
      type: String,
      trim: true
    },
    userEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    courseId: {
      type: String,
      required: true,
      trim: true
    },
    courseName: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentStatus: {
      type: String,
      default: "Success",
      trim: true
    },
    paymentMethod: {
      type: String,
      default: "Card",
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false,
    strict: false
  }
);

paymentSchema.index({ userId: 1, courseId: 1, paymentStatus: 1 });

export default paymentsDb.models.Payment
  || paymentsDb.model("Payment", paymentSchema, "payments");
