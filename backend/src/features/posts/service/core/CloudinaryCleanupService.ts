import { logger } from "../../../../core/config/logger.js";
import CloudinaryService from "../../../media/CloudinaryService.js";

interface ICloudinaryCleanupService {
  cleanupFile(publicId: string, context: string): Promise<void>;
  handleResourceCleanup(fileUrl: string, context: string): Promise<void>;
}

class CloudinaryCleanupService implements ICloudinaryCleanupService {
  async cleanupFile(publicId: string, context: string): Promise<void> {
    try {
      await CloudinaryService.delete(publicId, "raw");
    } catch (error) {
      logger.error(
        { err: error, publicId, context },
        "Failed to cleanup file from Cloudinary",
      );
    }
  }

  async handleResourceCleanup(fileUrl: string, context: string): Promise<void> {
    const publicId = CloudinaryService.extractPublicId(fileUrl);

    if (!publicId) {
      logger.warn({ fileUrl, context }, "Could not extract public ID from URL");
      return;
    }

    await this.cleanupFile(publicId, context);
  }
}

const cloudinaryCleanupService = new CloudinaryCleanupService();

export { cloudinaryCleanupService, type ICloudinaryCleanupService };
