import { Readable } from "stream";

import { Post } from "@prisma/client";
import axios from "axios";
import { Request, Response } from "express";

import { downloadResource } from "../../../src/controllers/post/post.fetch.controller";
import prisma from "../../../src/core/config/db";
import { handleError } from "../../../src/core/error";
import { PostNotFoundError } from "../../../src/core/error/custom/post.error";

import { createAuthenticatedUser } from "./shared/helpers";
import { createMockRequest, createMockResponse } from "./shared/mocks";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("axios");
vi.mock("../../../src/features/media/cloudinaryServices.js");

vi.mock("../../../src/core/config/logger.js", () => ({
  createLogger: vi.fn(() => ({
    child: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
  logger: {
    child: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../../src/core/error/index.js", () => ({
  handleError: vi.fn(),
}));

vi.mock("../../../src/core/config/db.js", () => ({
  default: {
    post: {
      findUnique: vi.fn(),
    },
  },
}));

describe("downloadResource controller", () => {
  const resourceId = "f34042c4-6143-4c8e-a790-49ba409529e8";

  const mockResourcePost: Post = {
    id: resourceId,
    title: "Test Post",
    content: null,
    hidden: false,
    authorId: "author-id",
    type: "RESOURCE",
    fileName: "testfile.pdf",
    fileSize: 1024,
    fileUrl: "https://res.cloudinary.com/demo/testfile.pdf",
    mimeType: "application/pdf",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let mockReq: Request;
  let mockRes: Response;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    vi.clearAllMocks();
  });

  describe("success cases", () => {
    it("should download a resource successfully with all headers", async () => {
      const mockStream = new Readable();

      mockStream.push("file content");
      mockStream.push(null);
      mockStream.pipe = vi.fn();

      mockReq.user = createAuthenticatedUser();
      mockReq.params = { id: resourceId };
      mockReq.on = vi.fn();

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockResourcePost);
      vi.mocked(axios).mockResolvedValue({
        data: mockStream,
        headers: {
          "content-length": "1024",
          "content-type": "application/pdf",
        },
      });

      await downloadResource(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Content-Disposition",
        'attachment; filename="testfile.pdf"'
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "application/pdf"
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith("Content-Length", 1024);
      expect(mockStream.pipe).toHaveBeenCalledWith(mockRes);
    });

    it("should handle resource without content-length header", async () => {
      const mockStream = new Readable();
      mockStream.push("file content");
      mockStream.push(null);
      mockStream.pipe = vi.fn();

      mockReq.user = createAuthenticatedUser();
      mockReq.params = { id: resourceId };
      mockReq.on = vi.fn();

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockResourcePost);
      vi.mocked(axios).mockResolvedValue({
        data: mockStream,
        headers: {
          "content-type": "application/pdf",
        },
      });

      await downloadResource(mockReq, mockRes);

      expect(mockRes.setHeader).not.toHaveBeenCalledWith(
        "Content-Length",
        expect.anything()
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Content-Disposition",
        'attachment; filename="testfile.pdf"'
      );
    });

    it("should use fallback filename when fileName is null", async () => {
      const mockStream = new Readable();
      mockStream.push("file content");
      mockStream.push(null);
      mockStream.pipe = vi.fn();

      const resourceWithoutFileName = {
        ...mockResourcePost,
        fileName: null,
      };

      mockReq.user = createAuthenticatedUser();
      mockReq.params = { id: resourceId };
      mockReq.on = vi.fn();

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        resourceWithoutFileName
      );
      vi.mocked(axios).mockResolvedValue({
        data: mockStream,
        headers: { "content-type": "application/pdf" },
      });

      await downloadResource(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Content-Disposition",
        'attachment; filename="file"'
      );
    });

    it("should use response content-type when mimeType is null", async () => {
      const mockStream = new Readable();
      mockStream.push("file content");
      mockStream.push(null);
      mockStream.pipe = vi.fn();

      const resourceWithoutMimeType = {
        ...mockResourcePost,
        mimeType: null,
      };

      mockReq.user = createAuthenticatedUser();
      mockReq.params = { id: resourceId };
      mockReq.on = vi.fn();

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        resourceWithoutMimeType
      );
      vi.mocked(axios).mockResolvedValue({
        data: mockStream,
        headers: { "content-type": "application/octet-stream" },
      });

      await downloadResource(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "application/octet-stream"
      );
    });
  });

  describe("authentication cases", () => {
    it("should reject unauthenticated requests", async () => {
      mockReq.user = undefined;
      mockReq.params = { id: resourceId };

      await downloadResource(mockReq, mockRes);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.post.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("validation cases", () => {
    it("should handle invalid post ID format", async () => {
      mockReq.user = createAuthenticatedUser();
      mockReq.params = { id: "invalid-id" };

      await downloadResource(mockReq, mockRes);

      expect(handleError).toHaveBeenCalled();
    });

    it("should call handleError when resource not found", async () => {
      mockReq.user = createAuthenticatedUser();
      mockReq.params = { id: resourceId };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      await downloadResource(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(PostNotFoundError),
        mockRes
      );
    });

    it("should call handleError when resource has no fileUrl", async () => {
      const resourceWithoutUrl = {
        ...mockResourcePost,
        fileUrl: null,
      };

      mockReq.user = createAuthenticatedUser();
      mockReq.params = { id: resourceId };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(resourceWithoutUrl);

      await downloadResource(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(expect.any(Error), mockRes);
    });

    it("should call handleError when resource has empty fileUrl", async () => {
      const resourceWithEmptyUrl = {
        ...mockResourcePost,
        fileUrl: "",
      };

      mockReq.user = createAuthenticatedUser();
      mockReq.params = { id: resourceId };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(resourceWithEmptyUrl);

      await downloadResource(mockReq, mockRes);

      expect(handleError).toHaveBeenCalled();
    });
  });

  describe("streaming cases", () => {
    it("should handle stream errors gracefully", async () => {
      const mockStream = new Readable();
      mockStream.pipe = vi.fn();
      mockStream.on = vi.fn((event, handler) => {
        if (event === "error") {
          // Store the error handler to call it later
          setTimeout(() => handler(new Error("Stream error")), 0);
        }
        return mockStream;
      });

      mockReq.user = createAuthenticatedUser();
      mockReq.params = { id: resourceId };
      mockReq.on = vi.fn();

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockResourcePost);
      vi.mocked(axios).mockResolvedValue({
        data: mockStream,
        headers: { "content-type": "application/pdf" },
      });

      await downloadResource(mockReq, mockRes);

      // Wait for error handler to be called
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith("Error streaming file");
    });

    it("should handle user aborting download", async () => {
      const mockStream = new Readable();
      mockStream.destroy = vi.fn();
      mockStream.pipe = vi.fn();
      mockStream.on = vi.fn().mockReturnValue(mockStream);

      let closeHandler: () => void;
      mockReq.user = createAuthenticatedUser();
      mockReq.params = { id: resourceId };
      mockReq.on = vi.fn((event, handler) => {
        if (event === "close") {
          closeHandler = handler;
        }
        return mockReq;
      });
      (mockRes as any).writableEnded = false;

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockResourcePost);
      vi.mocked(axios).mockResolvedValue({
        data: mockStream,
        headers: { "content-type": "application/pdf" },
      });

      await downloadResource(mockReq, mockRes);

      // Simulate user closing connection
      closeHandler!();

      expect(mockStream.destroy).toHaveBeenCalled();
    });

    it("should not destroy stream if response already ended", async () => {
      const mockStream = new Readable();
      mockStream.destroy = vi.fn();
      mockStream.pipe = vi.fn();
      mockStream.on = vi.fn().mockReturnValue(mockStream);

      let closeHandler: () => void;
      mockReq.user = createAuthenticatedUser();
      mockReq.params = { id: resourceId };
      mockReq.on = vi.fn((event, handler) => {
        if (event === "close") {
          closeHandler = handler;
        }
        return mockReq;
      });
      (mockRes as any).writableEnded = true;

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockResourcePost);
      vi.mocked(axios).mockResolvedValue({
        data: mockStream,
        headers: { "content-type": "application/pdf" },
      });

      await downloadResource(mockReq, mockRes);

      // Simulate user closing connection after response ended
      closeHandler!();

      expect(mockStream.destroy).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle database errors", async () => {
      const dbError = new Error("Database connection failed");

      mockReq.user = createAuthenticatedUser();
      mockReq.params = { id: resourceId };

      vi.mocked(prisma.post.findUnique).mockRejectedValue(dbError);

      await downloadResource(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(dbError, mockRes);
    });

    it("should handle axios errors", async () => {
      const axiosError = new Error("Failed to fetch from Cloudinary");

      mockReq.user = createAuthenticatedUser();
      mockReq.params = { id: resourceId };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockResourcePost);
      vi.mocked(axios).mockRejectedValue(axiosError);

      await downloadResource(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(axiosError, mockRes);
    });

    it("should handle timeout errors", async () => {
      const timeoutError = { code: "ETIMEDOUT", message: "timeout" };

      mockReq.user = createAuthenticatedUser();
      mockReq.params = { id: resourceId };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockResourcePost);
      vi.mocked(axios).mockRejectedValue(timeoutError);

      await downloadResource(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(timeoutError, mockRes);
    });

    it("should not send error response if headers already sent", async () => {
      const mockStream = new Readable();
      mockStream.pipe = vi.fn();
      mockStream.on = vi.fn((event, handler) => {
        if (event === "error") {
          setTimeout(() => handler(new Error("Stream error")), 0);
        }
        return mockStream;
      });
      mockRes.headersSent = true;

      mockReq.user = createAuthenticatedUser();
      mockReq.params = { id: resourceId };
      mockReq.on = vi.fn();

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockResourcePost);
      vi.mocked(axios).mockResolvedValue({
        data: mockStream,
        headers: { "content-type": "application/pdf" },
      });

      await downloadResource(mockReq, mockRes);

      // Wait for error handler
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.destroy).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("different file types", () => {
    it("should handle image downloads", async () => {
      const mockStream = new Readable();
      mockStream.push("image data");
      mockStream.push(null);
      mockStream.pipe = vi.fn();
      mockStream.on = vi.fn().mockReturnValue(mockStream);

      const imageResource = {
        ...mockResourcePost,
        fileName: "image.png",
        mimeType: "image/png",
      };

      mockReq.user = createAuthenticatedUser();
      mockReq.params = { id: resourceId };
      mockReq.on = vi.fn();

      vi.mocked(prisma.post.findUnique).mockResolvedValue(imageResource);
      vi.mocked(axios).mockResolvedValue({
        data: mockStream,
        headers: { "content-type": "image/png" },
      });

      await downloadResource(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "image/png"
      );
    });

    it("should handle video downloads", async () => {
      const mockStream = new Readable();
      mockStream.push("video data");
      mockStream.push(null);
      mockStream.pipe = vi.fn();
      mockStream.on = vi.fn().mockReturnValue(mockStream);

      const videoResource = {
        ...mockResourcePost,
        fileName: "video.mp4",
        mimeType: "video/mp4",
        fileSize: 50000000, // 50MB
      };

      mockReq.user = createAuthenticatedUser();
      mockReq.params = { id: resourceId };
      mockReq.on = vi.fn();

      vi.mocked(prisma.post.findUnique).mockResolvedValue(videoResource);
      vi.mocked(axios).mockResolvedValue({
        data: mockStream,
        headers: {
          "content-length": "50000000",
          "content-type": "video/mp4",
        },
      });

      await downloadResource(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "video/mp4"
      );
    });

    it("should handle document downloads with special characters in filename", async () => {
      const mockStream = new Readable();
      mockStream.push("doc data");
      mockStream.push(null);
      mockStream.pipe = vi.fn();
      mockStream.on = vi.fn().mockReturnValue(mockStream);

      const docResource = {
        ...mockResourcePost,
        fileName: "my document (v2).docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };

      mockReq.user = createAuthenticatedUser();
      mockReq.params = { id: resourceId };
      mockReq.on = vi.fn();

      vi.mocked(prisma.post.findUnique).mockResolvedValue(docResource);
      vi.mocked(axios).mockResolvedValue({
        data: mockStream,
        headers: { "content-type": docResource.mimeType },
      });

      await downloadResource(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Content-Disposition",
        'attachment; filename="my document (v2).docx"'
      );
    });
  });
});
