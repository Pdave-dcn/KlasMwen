/* eslint-disable require-await */
import { Readable } from "stream";

import cloudinary from "../../core/config/cloudinary";
import { logger } from "../../core/config/logger";

interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  resourceType: string;
  bytes: number;
  width?: number;
  height?: number;
}

type CloudinaryResourceType = "image" | "video" | "raw";

/**
 * Service for handling Cloudinary operations.
 * Provides methods for uploading, deleting, and managing cloud storage files.
 */
class CloudinaryService {
  /**
   * Uploads a file buffer to Cloudinary using an upload stream.
   * Files are organized in folders: `posts/{userId}/{fileName}_{timestamp}`
   */
  static async upload(
    buffer: Buffer,
    originalName: string,
    mimetype: string,
    userId: string
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const resourceType = this.getResourceType(mimetype);
      const folder = `posts/${userId}`;

      const fileNameWithoutExt = originalName.split(".")[0];
      const sanitizedFileName = fileNameWithoutExt
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .replace(/_+/g, "_");

      const timestamp = Date.now();
      const publicId = `${sanitizedFileName}_${timestamp}`;

      const uploadOptions = {
        resource_type: resourceType,
        folder,
        public_id: publicId,
        use_filename: false,
        unique_filename: false,
        overwrite: false,
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            logger.error({ error }, "Cloudinary upload failed");
            reject(new Error(`Upload failed: ${error.message}`));
          } else if (result) {
            logger.info(
              { fileUrl: result.secure_url },
              "File uploaded to Cloudinary"
            );
            resolve({
              publicId: result.public_id,
              url: result.url,
              secureUrl: result.secure_url,
              format: result.format,
              resourceType: result.resource_type,
              bytes: result.bytes,
              width: result.width,
              height: result.height,
            });
          } else {
            reject(new Error("Upload failed - no result returned"));
          }
        }
      );

      const bufferStream = new Readable();
      bufferStream.push(buffer);
      bufferStream.push(null);
      bufferStream.pipe(uploadStream);
    });
  }

  /**
   * Deletes a file from Cloudinary using its public ID.
   */
  static async delete(
    publicId: string,
    resourceType: CloudinaryResourceType = "raw"
  ): Promise<void> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });

      if (result.result === "ok") {
        logger.info({ publicId }, "File deleted from Cloudinary");
      } else {
        logger.warn({ result }, "File deletion result");
      }
    } catch (error) {
      logger.error(
        { error, publicId, resourceType },
        "Cloudinary deletion failed"
      );
      throw error;
    }
  }

  /**
   * Maps MIME types to Cloudinary resource types.
   */
  static getResourceType(mimetype: string): CloudinaryResourceType {
    if (mimetype.startsWith("image/")) {
      return "image";
    } else if (mimetype.startsWith("video/")) {
      return "video";
    }
    return "raw";
  }

  /**
   * Extracts public_id from Cloudinary URLs.
   * Handles transformations, version numbers, and file extensions.
   */
  static extractPublicId(url: string): string | null {
    try {
      const urlParts = url.split("upload/");
      if (urlParts.length < 2) {
        return null;
      }

      let pathAfterUpload = urlParts[1];

      // Remove transformation segments
      pathAfterUpload = pathAfterUpload.replace(
        /^(?:[a-z]_[^/,]+(?:,\s*)?)+\//g,
        ""
      );

      while (/^[a-z]_[^/]+\//.test(pathAfterUpload)) {
        pathAfterUpload = pathAfterUpload.replace(/^[a-z]_[^/]+\//, "");
      }

      // Remove version number
      pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, "");

      // Remove file extension
      const publicId = pathAfterUpload.replace(/\.[^.]+$/, "");

      return publicId || null;
    } catch (error) {
      logger.error({ error, url }, "Error extracting public_id from URL");
      return null;
    }
  }

  /**
   * Extracts file extension from filename.
   */
  static getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf(".");
    if (lastDotIndex <= 0) {
      return "";
    }
    return filename.slice(lastDotIndex + 1).toLowerCase();
  }
}

export default CloudinaryService;
