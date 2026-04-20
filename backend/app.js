import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import courseRoutes from "./routes/courseRoutes.js";
import moduleRoutes from "./routes/moduleRoutes.js";
import lessonRoutes from "./routes/lessonRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import toolRoutes from "./routes/toolRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import catalogRoutes from "./routes/catalogRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const startServer = async () => {
  try {
    await connectDB();

    const app = express();

    app.use(cors());
    app.use(express.json());
    app.use("/uploads", express.static(path.join(__dirname, "uploads")));

    // ROUTES
    app.use("/api/courses", courseRoutes);
    app.use("/api/modules", moduleRoutes);
    app.use("/api/lessons", lessonRoutes);
    app.use("/api/files", fileRoutes);
    app.use("/api/tools", toolRoutes);
    app.use("/api/auth", authRoutes);
    app.use("/api/catalog", catalogRoutes);

    app.get("/", (req, res) => {
      res.send("LMS API running");
    });

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("Failed to start server due to DB connection error.");
    process.exit(1);
  }
};

startServer();
