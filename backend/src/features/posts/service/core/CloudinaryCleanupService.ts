import { logger } from "../../../../core/config/logger";
import CloudinaryService from "../../../media/CloudinaryService";

/**
 * Handles Cloudinary file cleanup operations.
 * Ensures consistent error handling and logging for file operations.
 */
export class CloudinaryCleanupService {
  /**
   * Clean up uploaded file from Cloudinary.
   * Logs errors but doesn't throw to prevent blocking main operation.
   */
  static async cleanupFile(publicId: string, context: string): Promise<void> {
    try {
      await CloudinaryService.delete(publicId, "raw");
    } catch (error) {
      logger.error(
        { err: error, publicId, context },
        "Failed to cleanup file from Cloudinary"
      );
    }
  }

  /**
   * Handle Cloudinary cleanup for resource posts.
   */
  static async handleResourceCleanup(
    fileUrl: string,
    context: string
  ): Promise<void> {
    const publicId = CloudinaryService.extractPublicId(fileUrl);

    if (!publicId) {
      logger.warn({ fileUrl, context }, "Could not extract public ID from URL");
      return;
    }

    await this.cleanupFile(publicId, context);
  }
}
