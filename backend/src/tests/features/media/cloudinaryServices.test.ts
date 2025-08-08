import { Writable } from "stream";

import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";

import cloudinary from "../../../core/config/cloudinary.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
  getFileExtension,
} from "../../../features/media/cloudinaryServices.js";

vi.mock("../../../core/config/cloudinary.js", () => ({
  default: {
    uploader: {
      // Mock upload_stream to return a proper Writable stream
      upload_stream: vi.fn(
        () =>
          new Writable({
            write(_chunk, _encoding, callback) {
              callback();
            },
          })
      ),
      destroy: vi.fn(),
    },
  },
}));

// Create typed references to the mocked functions
const mockUploadStream = cloudinary.uploader.upload_stream as Mock;
const mockDestroy = cloudinary.uploader.destroy as Mock;

describe("Cloudinary Service", () => {
  let consoleSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("uploadToCloudinary", () => {
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
      const result = await uploadToCloudinary(
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
        uploadToCloudinary(buffer, "test.pdf", "application/pdf", "user123")
      ).rejects.toThrow("Upload failed: Cloudinary upload failed");
    });
  });

  describe("deleteFromCloudinary", () => {
    it("should successfully delete a file", async () => {
      const mockDestroyResult = { result: "ok" };
      mockDestroy.mockResolvedValue(mockDestroyResult);

      await expect(
        deleteFromCloudinary("posts/user123/document_1234567890", "raw")
      ).resolves.toBeUndefined();

      expect(mockDestroy).toHaveBeenCalledWith(
        "posts/user123/document_1234567890",
        { resource_type: "raw" }
      );
    });

    it("should use default resource type 'raw' when not specified", async () => {
      const mockDestroyResult = { result: "ok" };
      mockDestroy.mockResolvedValue(mockDestroyResult);

      await deleteFromCloudinary("posts/user123/document_1234567890");

      expect(mockDestroy).toHaveBeenCalledWith(
        "posts/user123/document_1234567890",
        { resource_type: "raw" }
      );
    });
  });

  describe("extractPublicIdFromUrl", () => {
    it("should extract public_id from standard Cloudinary URL", () => {
      const url =
        "https://res.cloudinary.com/demo/image/upload/v1234567890/posts/user123/document.jpg";
      const result = extractPublicIdFromUrl(url);
      expect(result).toBe("posts/user123/document");
    });

    it("should handle URLs with transformations", () => {
      const url =
        "https://res.cloudinary.com/demo/image/upload/c_fill,w_300,h_200/v1234567890/posts/user123/image.jpg";
      const result = extractPublicIdFromUrl(url);
      // This test is correct, but your function likely needs to be fixed to pass it
      expect(result).toBe("posts/user123/image");
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
        expect(extractPublicIdFromUrl(url)).toBeNull();
      });
    });
  });

  describe("getFileExtension", () => {
    it("should return empty string for files without extension", () => {
      expect(getFileExtension("README")).toBe("");
      expect(getFileExtension("Dockerfile")).toBe("");
      expect(getFileExtension("no_extension")).toBe("");
    });
  });
});
