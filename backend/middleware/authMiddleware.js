import jwt from "jsonwebtoken";

import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

const normalizeRole = (role) => {
  const normalized = String(role || "user").trim().toLowerCase();
  return normalized === "admin" ? "admin" : "user";
};

const extractToken = (req) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length).trim();
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.userId).lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid session"
      });
    }

    req.user = {
      _id: String(user._id),
      email: user.email,
      role: normalizeRole(user.role),
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
      purchasedCourses: Array.isArray(user.purchasedCourses) ? user.purchasedCourses : []
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};

export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "You do not have access to this action"
    });
  }

  return next();
};
