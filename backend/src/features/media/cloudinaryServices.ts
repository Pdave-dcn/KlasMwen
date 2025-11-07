/* eslint-disable require-await*/
import { Readable } from "stream";

import cloudinary from "../../core/config/cloudinary.js";
import { logger } from "../../core/config/logger.js";

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

/**
 * Uploads a file buffer to Cloudinary using an upload stream.
 * Files are organized in folders: `posts/{userId}/{fileName}_{timestamp}`
 *
 * @param {Buffer} buffer - The file content as a buffer
 * @param {string} originalName - Original filename (e.g., 'document.pdf')
 * @param {string} mimetype - MIME type (e.g., 'application/pdf')
 * @param {string} userId - User ID for folder organization
 * @returns {Promise<CloudinaryUploadResult>} Upload result with URLs, size, and metadata
 */
const uploadToCloudinary = async (
  buffer: Buffer,
  originalName: string,
  mimetype: string,
  userId: string
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    // Determine resource type based on MIME type
    const resourceType = getResourceType(mimetype);

    // Create folder structure: posts/userId/
    const folder = `posts/${userId}`;

    // Generate a clean filename without extension for public_id
    const fileName = originalName.split(".")[0].replace(/[^a-zA-Z0-9]/g, "_");
    const timestamp = Date.now();
    const publicId = `${fileName}_${timestamp}`;

    const uploadOptions = {
      resource_type: resourceType,
      folder,
      public_id: publicId,
      use_filename: false,
      unique_filename: false,
      overwrite: false,
    };

    // Create upload stream
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

    // Convert buffer to readable stream
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);

    // Pipe to Cloudinary
    bufferStream.pipe(uploadStream);
  });
};

/**
 * Deletes a file from Cloudinary using its public ID.
 *
 * @param {string} publicId - Cloudinary public ID (without extension)
 * @param {"image" | "video" | "raw"} resourceType - Resource type, defaults to "raw"
 * @returns {Promise<void>}
 * @throws Will throw if deletion fails
 */
const deleteFromCloudinary = async (
  publicId: string,
  resourceType: "image" | "video" | "raw" = "raw"
): Promise<void> => {
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
};

/**
 * Maps MIME types to Cloudinary resource types.
 * - image/* → "image"
 * - video/* → "video"
 * - everything else → "raw"
 *
 * @param {string} mimetype - File MIME type
 * @returns {"image" | "video" | "raw"} Cloudinary resource type
 */
const getResourceType = (mimetype: string): "image" | "video" | "raw" => {
  if (mimetype.startsWith("image/")) {
    return "image";
  } else if (mimetype.startsWith("video/")) {
    return "video";
  } else {
    return "raw";
  }
};

/**
 * Extracts public_id from Cloudinary URLs.
 * Removes version numbers (v1234567), transformations, and file extensions.
 *
 * @param {string} url - Full Cloudinary URL
 * @returns {string | null} Public ID or null if extraction fails
 */
const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    const urlParts = url.split("upload/");
    if (urlParts.length < 2) {
      return null;
    }

    const pathAfterUpload = urlParts[1];

    // Regex to match and capture the public ID part.
    // It looks for an optional transformation section (c_*, w_*, etc.),
    // an optional version number (v followed by digits), and then captures
    // everything until the file extension.
    const regex =
      /(?:(?:[a-z]_\w+|[a-z]_\w+,\s*)*\/)?(?:v\d+\/)?(.+?)(?:\.\w+)?$/;
    const match = pathAfterUpload.match(regex);

    if (match?.[1]) {
      // The captured group is the public ID
      return match[1];
    }

    return null;
  } catch (error) {
    console.error("Error extracting public_id from URL:", error);
    return null;
  }
};

/**
 * Extracts file extension from filename.
 *
 * @example
 * getFileExtension("document.pdf") // → "pdf"
 * getFileExtension("no_extension") // → ""
 *
 * @param {string} filename - The filename
 * @returns {string} Lowercase extension or empty string
 */
const getFileExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf(".");
  // If there's no dot or it's the first character, there's no extension
  if (lastDotIndex <= 0) {
    return "";
  }
  return filename.slice(lastDotIndex + 1).toLowerCase();
};

export {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
  getFileExtension,
};
