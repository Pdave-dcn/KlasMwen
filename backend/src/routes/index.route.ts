import express from "express";

import prisma from "../config/db.js";

import authRoutes from "./auth.route.js";

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

router.use(/.*/, (_req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

export default router;
