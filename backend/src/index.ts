//import "./core/config/env.js";
import app from "./app.js";
import { verifyCloudinaryConnection } from "./core/config/cloudinary.js";
import prisma from "./core/config/db.js";
import { createLogger } from "./core/config/logger.js";

const logger = createLogger({ module: "ServerStartup" });
const PORT = process.env.PORT ?? 3000;

const startServer = async () => {
  logger.info("Server startup initiated");
  const startTime = Date.now();

  try {
    logger.info("Verifying external connections");

    // Verify Cloudinary connection
    const cloudinaryStartTime = Date.now();
    await verifyCloudinaryConnection();
    const cloudinaryDuration = Date.now() - cloudinaryStartTime;
    logger.info({ cloudinaryDuration }, "Cloudinary connection verified");

    // Verify Database connection
    const dbStartTime = Date.now();
    await prisma.$connect();
    const dbDuration = Date.now() - dbStartTime;
    logger.info({ dbDuration }, "Database connected successfully");

    // Start server
    const serverStartTime = Date.now();
    app.listen(PORT, () => {
      const serverDuration = Date.now() - serverStartTime;
      const totalDuration = Date.now() - startTime;

      logger.info(
        {
          port: PORT,
          serverDuration,
          totalDuration,
        },
        "Server is running successfully"
      );
    });
  } catch (error) {
    const failureDuration = Date.now() - startTime;
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        failureDuration,
      },
      "Server startup failed"
    );
    throw error;
  }
};

startServer().catch((error) => {
  logger.error(
    {
      error: error instanceof Error ? error.message : String(error),
    },
    "Failed to start server"
  );
  throw new Error("Server startup failed");
});
