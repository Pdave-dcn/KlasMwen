import { server } from "./app.js";
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
    logger.info(
      { cloudinaryDuration: Date.now() - cloudinaryStartTime },
      "Cloudinary connection verified"
    );

    // Verify Database connection
    const dbStartTime = Date.now();
    await prisma.$connect();
    logger.info(
      { dbDuration: Date.now() - dbStartTime },
      "Database connected successfully"
    );

    // Start HTTP + Socket.IO server
    const serverStartTime = Date.now();
    server.listen(PORT, () => {
      logger.info(
        {
          port: PORT,
          serverDuration: Date.now() - serverStartTime,
          totalDuration: Date.now() - startTime,
        },
        "Server is running successfully"
      );
    });
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        failureDuration: Date.now() - startTime,
      },
      "Server startup failed"
    );
    throw error;
  }
};

await startServer();
