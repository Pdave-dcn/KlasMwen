import express from "express";

import prisma from "../core/config/db.js";

import authRoutes from "./auth.route.js";
import commentRoutes from "./comment.route.js";
import postRoutes from "./post.route.js";
import reactionRoutes from "./reaction.route.js";
import searchRoutes from "./search.route.js";
import tagRoutes from "./tag.route.js";
import userRoutes from "./user.route.js";

const router = express.Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "UP", message: "Server is healthy" });
});

router.get("/status", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "UP",
      server: "running",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Detailed health check failed:", error);
    res.status(500).json({
      status: "DOWN",
      server: "running (but unhealthy)",
      database: "disconnected",
      error: "Failed to connect to database",
      timestamp: new Date().toISOString(),
    });
  }
});

router.use("/api", authRoutes);
router.use("/api", userRoutes);
router.use("/api", postRoutes);
router.use("/api", commentRoutes);
router.use("/api", reactionRoutes);
router.use("/api", tagRoutes);
router.use("/api", searchRoutes);

router.use(/.*/, (_req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

export default router;
