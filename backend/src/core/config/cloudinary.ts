import { v2 as cloudinary } from "cloudinary";

import env from "./env.js";
import { createLogger } from "./logger.js";

const logger = createLogger({ module: "CloudinaryConfig" });

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export const verifyCloudinaryConnection = async () => {
  logger.info("Cloudinary connection verification started");
  const startTime = Date.now();

  try {
    await cloudinary.api.ping();
    const duration = Date.now() - startTime;
    logger.info(
      {
        duration,
      },
      "Cloudinary connected successfully"
    );
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        duration,
      },
      "Cloudinary connection failed"
    );
    return false;
  }
};

export default cloudinary;
