/**
 * Multer File Upload Configuration
 *
 * - Memory storage (files in RAM, not disk)
 * - 10MB file size limit
 * - Accepts: PDFs, Office docs, images, text files
 */

import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",

      // Images
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    cb(null, allowedMimes.includes(file.mimetype));
  },
});

export default upload;
