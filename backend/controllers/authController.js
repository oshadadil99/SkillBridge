import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const normalizeRole = (role) => {
  const normalized = String(role || "user").trim().toLowerCase();
  return normalized === "admin" ? "admin" : "user";
};

const sanitizeUser = (user) => ({
  _id: String(user._id),
  name: user.name || "",
  email: user.email || "",
  role: normalizeRole(user.role),
  permissions: Array.isArray(user.permissions) ? user.permissions : [],
  purchasedCourses: Array.isArray(user.purchasedCourses) ? user.purchasedCourses : []
});

export const login = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ email }).lean();

    if (!user?.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        userId: String(user._id),
        role: normalizeRole(user.role)
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      data: {
        token,
        user: sanitizeUser(user)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.json({
      success: true,
      data: sanitizeUser(user)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
