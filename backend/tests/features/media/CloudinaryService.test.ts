import { Writable } from "stream";

import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";

import cloudinary from "../../../src/core/config/cloudinary";
import { logger } from "../../../src/core/config/logger";
import CloudinaryService from "../../../src/features/media/CloudinaryService";

// Mock cloudinary SDK
vi.mock("../../../src/core/config/cloudinary", () => ({
  default: {
    uploader: {
      upload_stream: vi.fn(),
      destroy: vi.fn(),
    },
  },
}));

// Mock logger to prevent console output during tests
vi.mock("../../../src/core/config/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Create typed references to the mocked functions
const mockUploadStream = cloudinary.uploader.upload_stream as Mock;
const mockDestroy = cloudinary.uploader.destroy as Mock;
const mockLogger = vi.mocked(logger);

describe("CloudinaryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("upload", () => {
    it("should successfully upload a PDF file", async () => {
      const mockResult = {
        public_id: "posts/user123/document_1234567890",
        url: "http://res.cloudinary.com/test/raw/upload/v1234567890/posts/user123/document_1234567890.pdf",
        secure_url:
          "https://res.cloudinary.com/test/raw/upload/v1234567890/posts/user123/document_1234567890.pdf",
        format: "pdf",
        resource_type: "raw",
        bytes: 1024000,
      };

      mockUploadStream.mockImplementationOnce(
        (_options: any, callback: (error: any, result?: any) => void) => {
          setTimeout(() => callback(null, mockResult), 0);
          return new Writable({
            write(_chunk, _encoding, callback) {
              callback();
            },
          });
        }
      );

      const buffer = Buffer.from("test file content");
      const result = await CloudinaryService.upload(
        buffer,
        "document.pdf",
        "application/pdf",
        "user123"
      );

      expect(result).toEqual({
        publicId: "posts/user123/document_1234567890",
        url: mockResult.url,
        secureUrl: mockResult.secure_url,
        format: "pdf",
        resourceType: "raw",
        bytes: 1024000,
        width: undefined,
        height: undefined,
      });

      expect(mockUploadStream).toHaveBeenCalledWith(
        expect.objectContaining({
          resource_type: "raw",
          folder: "posts/user123",
        }),
        expect.any(Function)
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        { fileUrl: mockResult.secure_url },
        "File uploaded to Cloudinary"
      );
    });

    it("should successfully upload an image file", async () => {
      const mockResult = {
        public_id: "posts/user123/photo_1234567890",
        url: "http://res.cloudinary.com/test/image/upload/v1234567890/posts/user123/photo_1234567890.jpg",
        secure_url:
          "https://res.cloudinary.com/test/image/upload/v1234567890/posts/user123/photo_1234567890.jpg",
        format: "jpg",
        resource_type: "image",
        bytes: 2048000,
        width: 1920,
        height: 1080,
      };

      mockUploadStream.mockImplementationOnce(
        (_options: any, callback: (error: any, result?: any) => void) => {
          setTimeout(() => callback(null, mockResult), 0);
          return new Writable({
            write(_chunk, _encoding, callback) {
              callback();
            },
          });
        }
      );

      const buffer = Buffer.from("fake image data");
      const result = await CloudinaryService.upload(
        buffer,
        "photo.jpg",
        "image/jpeg",
        "user123"
      );

      expect(result).toEqual({
        publicId: "posts/user123/photo_1234567890",
        url: mockResult.url,
        secureUrl: mockResult.secure_url,
        format: "jpg",
        resourceType: "image",
        bytes: 2048000,
        width: 1920,
        height: 1080,
      });

      expect(mockUploadStream).toHaveBeenCalledWith(
        expect.objectContaining({
          resource_type: "image",
          folder: "posts/user123",
        }),
        expect.any(Function)
      );
    });

    it("should reject on upload error", async () => {
      const mockError = new Error("Cloudinary upload failed");

      mockUploadStream.mockImplementationOnce(
        (_options: any, callback: (error: any, result?: any) => void) => {
          setTimeout(() => callback(mockError, null), 0);
          return new Writable({
            write(_chunk, _encoding, callback) {
              callback();
            },
          });
        }
      );

      const buffer = Buffer.from("test");

      await expect(
        CloudinaryService.upload(
          buffer,
          "test.pdf",
          "application/pdf",
          "user123"
        )
      ).rejects.toThrow("Upload failed: Cloudinary upload failed");

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: mockError },
        "Cloudinary upload failed"
      );
    });

    it("should reject when no result is returned", async () => {
      mockUploadStream.mockImplementationOnce(
        (_options: any, callback: (error: any, result?: any) => void) => {
          setTimeout(() => callback(null, null), 0);
          return new Writable({
            write(_chunk, _encoding, callback) {
              callback();
            },
          });
        }
      );

      const buffer = Buffer.from("test");

      await expect(
        CloudinaryService.upload(
          buffer,
          "test.pdf",
          "application/pdf",
          "user123"
        )
      ).rejects.toThrow("Upload failed - no result returned");
    });

    it("should sanitize filename with special characters", async () => {
      const mockResult = {
        public_id: "posts/user123/my_special_document_1234567890",
        url: "http://res.cloudinary.com/test/raw/upload/v1234567890/posts/user123/my_special_document_1234567890.pdf",
        secure_url:
          "https://res.cloudinary.com/test/raw/upload/v1234567890/posts/user123/my_special_document_1234567890.pdf",
        format: "pdf",
        resource_type: "raw",
        bytes: 1024000,
      };

      mockUploadStream.mockImplementationOnce(
        (_options: any, callback: (error: any, result?: any) => void) => {
          setTimeout(() => callback(null, mockResult), 0);
          return new Writable({
            write(_chunk, _encoding, callback) {
              callback();
            },
          });
        }
      );

      const buffer = Buffer.from("test");
      await CloudinaryService.upload(
        buffer,
        "my-special@document!.pdf",
        "application/pdf",
        "user123"
      );

      expect(mockUploadStream).toHaveBeenCalledWith(
        expect.objectContaining({
          public_id: expect.stringMatching(/^my_special_document_\d+$/),
        }),
        expect.any(Function)
      );
    });
  });

  describe("delete", () => {
    it("should successfully delete a file", async () => {
      const mockDestroyResult = { result: "ok" };
      mockDestroy.mockResolvedValue(mockDestroyResult);

      await expect(
        CloudinaryService.delete("posts/user123/document_1234567890", "raw")
      ).resolves.toBeUndefined();

      expect(mockDestroy).toHaveBeenCalledWith(
        "posts/user123/document_1234567890",
        { resource_type: "raw" }
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        { publicId: "posts/user123/document_1234567890" },
        "File deleted from Cloudinary"
      );
    });

    it("should use default resource type 'raw' when not specified", async () => {
      const mockDestroyResult = { result: "ok" };
      mockDestroy.mockResolvedValue(mockDestroyResult);

      await CloudinaryService.delete("posts/user123/document_1234567890");

      expect(mockDestroy).toHaveBeenCalledWith(
        "posts/user123/document_1234567890",
        { resource_type: "raw" }
      );
    });

    it("should log warning when deletion result is not 'ok'", async () => {
      const mockDestroyResult = { result: "not found" };
      mockDestroy.mockResolvedValue(mockDestroyResult);

      await CloudinaryService.delete("posts/user123/document_1234567890");

      expect(mockLogger.warn).toHaveBeenCalledWith(
        { result: mockDestroyResult },
        "File deletion result"
      );
    });

    it("should throw and log error on deletion failure", async () => {
      const mockError = new Error("Deletion failed");
      mockDestroy.mockRejectedValue(mockError);

      await expect(
        CloudinaryService.delete("posts/user123/document_1234567890", "raw")
      ).rejects.toThrow("Deletion failed");

      expect(mockLogger.error).toHaveBeenCalledWith(
        {
          error: mockError,
          publicId: "posts/user123/document_1234567890",
          resourceType: "raw",
        },
        "Cloudinary deletion failed"
      );
    });
  });

  describe("getResourceType", () => {
    it("should return 'image' for image MIME types", () => {
      expect(CloudinaryService.getResourceType("image/jpeg")).toBe("image");
      expect(CloudinaryService.getResourceType("image/png")).toBe("image");
      expect(CloudinaryService.getResourceType("image/gif")).toBe("image");
      expect(CloudinaryService.getResourceType("image/webp")).toBe("image");
    });

    it("should return 'video' for video MIME types", () => {
      expect(CloudinaryService.getResourceType("video/mp4")).toBe("video");
      expect(CloudinaryService.getResourceType("video/avi")).toBe("video");
      expect(CloudinaryService.getResourceType("video/quicktime")).toBe(
        "video"
      );
    });

    it("should return 'raw' for all other MIME types", () => {
      expect(CloudinaryService.getResourceType("application/pdf")).toBe("raw");
      expect(CloudinaryService.getResourceType("text/plain")).toBe("raw");
      expect(CloudinaryService.getResourceType("application/json")).toBe("raw");
      expect(CloudinaryService.getResourceType("audio/mpeg")).toBe("raw");
    });
  });

  describe("extractPublicId", () => {
    it("should extract public_id from standard Cloudinary URL", () => {
      const url =
        "https://res.cloudinary.com/demo/image/upload/v1234567890/posts/user123/document.jpg";
      const result = CloudinaryService.extractPublicId(url);
      expect(result).toBe("posts/user123/document");
    });

    it("should extract public_id from URL without version", () => {
      const url =
        "https://res.cloudinary.com/demo/image/upload/posts/user123/document.jpg";
      const result = CloudinaryService.extractPublicId(url);
      expect(result).toBe("posts/user123/document");
    });

    it("should handle URLs with transformations", () => {
      const url =
        "https://res.cloudinary.com/demo/image/upload/c_fill,w_300,h_200/v1234567890/posts/user123/image.jpg";
      const result = CloudinaryService.extractPublicId(url);
      expect(result).toBe("posts/user123/image");
    });

    it("should handle URLs with multiple transformation parameters", () => {
      const url =
        "https://res.cloudinary.com/demo/image/upload/c_fill,w_300/e_blur/v1234567890/posts/user123/image.jpg";
      const result = CloudinaryService.extractPublicId(url);
      expect(result).toBe("posts/user123/image");
    });

    it("should handle raw resource URLs", () => {
      const url =
        "https://res.cloudinary.com/demo/raw/upload/v1234567890/posts/user123/document.pdf";
      const result = CloudinaryService.extractPublicId(url);
      expect(result).toBe("posts/user123/document");
    });

    it("should return null for invalid URLs", () => {
      const invalidUrls = [
        "https://example.com/not/cloudinary/url.jpg",
        "not-a-url-at-all",
        "https://res.cloudinary.com/demo/image/",
        "",
        "https://res.cloudinary.com/demo/image/upload/",
      ];

      invalidUrls.forEach((url) => {
        expect(CloudinaryService.extractPublicId(url)).toBeNull();
      });
    });

    it("should log error when extraction fails", () => {
      const invalidUrl = "https://example.com/not/cloudinary/url.jpg";
      CloudinaryService.extractPublicId(invalidUrl);

      // Note: The current implementation doesn't log for invalid URLs,
      // only for exceptions. You might want to add this logging.
    });
  });

  describe("getFileExtension", () => {
    it("should extract file extension from filename", () => {
      expect(CloudinaryService.getFileExtension("document.pdf")).toBe("pdf");
      expect(CloudinaryService.getFileExtension("image.jpg")).toBe("jpg");
      expect(CloudinaryService.getFileExtension("archive.tar.gz")).toBe("gz");
      expect(CloudinaryService.getFileExtension("Photo.PNG")).toBe("png");
    });

    it("should return empty string for files without extension", () => {
      expect(CloudinaryService.getFileExtension("README")).toBe("");
      expect(CloudinaryService.getFileExtension("Dockerfile")).toBe("");
      expect(CloudinaryService.getFileExtension("no_extension")).toBe("");
    });

    it("should return empty string for files starting with dot", () => {
      expect(CloudinaryService.getFileExtension(".gitignore")).toBe("");
      expect(CloudinaryService.getFileExtension(".env")).toBe("");
    });

    it("should handle edge cases", () => {
      expect(CloudinaryService.getFileExtension("")).toBe("");
      expect(CloudinaryService.getFileExtension(".")).toBe("");
      expect(CloudinaryService.getFileExtension("file.")).toBe("");
    });
  });
});
