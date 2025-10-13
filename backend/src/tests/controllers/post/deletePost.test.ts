import { Request, Response } from "express";

import { deletePost } from "../../../controllers/post.controller";
import prisma from "../../../core/config/db";
import { handleError } from "../../../core/error";
import { AuthorizationError } from "../../../core/error/custom/auth.error";
import {
  deleteFromCloudinary,
  extractPublicIdFromUrl,
} from "../../../features/media/cloudinaryServices";

import { createAuthenticatedUser } from "./shared/helpers";
import { createMockRequest, createMockResponse } from "./shared/mocks";

vi.mock("../../../features/media/cloudinaryServices.js");

vi.mock("../../../core/config/logger.js", () => ({
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

vi.mock("../../../core/error/index.js", () => ({
  handleError: vi.fn(),
}));

vi.mock("../../../core/config/db.js", () => ({
  default: {
    post: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    bookmark: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    like: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe("deletePost", () => {
  const mockPostId = "f34042c4-6143-4c8e-a790-49ba409529e8";
  const mockUserId = "2751f51c-f504-44bc-b443-fd21bd9da6eb";

  const mockPostInDb = { id: mockPostId, authorId: mockUserId };

  const mockResourcePostInDb = {
    ...mockPostInDb,
    type: "RESOURCE",
    fileUrl: "http://cloudinary.com/image/upload/v12345/publicId.jpg",
    fileName: "document.pdf",
  };

  let mockReq: Request;
  let mockRes: Response;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    vi.clearAllMocks();
  });

  describe("Basic Functionality", () => {
    it("should successfully delete a post if the user is the author", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostInDb as any);
      vi.mocked(prisma.post.delete).mockResolvedValue(mockPostInDb as any);

      await deletePost(mockReq, mockRes);

      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: mockPostId },
      });
      expect(prisma.post.delete).toHaveBeenCalledWith({
        where: { id: mockPostId },
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Post deleted successfully",
      });
    });

    it("should successfully delete a post and its file if it is a RESOURCE type", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        mockResourcePostInDb as any
      );
      vi.mocked(extractPublicIdFromUrl).mockReturnValue("publicId");
      vi.mocked(prisma.post.delete).mockResolvedValue(
        mockResourcePostInDb as any
      );

      await deletePost(mockReq, mockRes);

      expect(extractPublicIdFromUrl).toHaveBeenCalledWith(
        mockResourcePostInDb.fileUrl
      );
      expect(deleteFromCloudinary).toHaveBeenCalledWith("publicId", "raw");
      expect(prisma.post.delete).toHaveBeenCalledWith({
        where: { id: mockPostId },
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if the post is not found", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: "2751f51c-f504-44bc-b443-fd21bd9da6eb" };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      await deletePost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Post not found" });
      expect(prisma.post.delete).not.toHaveBeenCalled();
    });
  });

  describe("Authentication & Authorization", () => {
    it("should return 401 if the user is not authenticated", async () => {
      mockReq.params = { id: mockPostId };

      await deletePost(mockReq, mockRes);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.post.delete).not.toHaveBeenCalled();
    });

    it("should call handleError with AuthorizationError when user is not the author and not an ADMIN", async () => {
      mockReq.user = createAuthenticatedUser();
      mockReq.params = { id: mockPostId };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostInDb as any);

      await deletePost(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthorizationError),
        mockRes
      );
      expect(prisma.post.delete).not.toHaveBeenCalled();
    });

    it("should allow an ADMIN user to delete any post", async () => {
      mockReq.user = createAuthenticatedUser({ role: "ADMIN" });
      mockReq.params = { id: mockPostId };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostInDb as any);
      vi.mocked(prisma.post.delete).mockResolvedValue(mockPostInDb as any);

      await deletePost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Post deleted successfully",
      });
    });

    it("should allow an ADMIN user to delete a RESOURCE post with file cleanup", async () => {
      mockReq.user = createAuthenticatedUser({ role: "ADMIN" });
      mockReq.params = { id: mockPostId };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        mockResourcePostInDb as any
      );
      vi.mocked(extractPublicIdFromUrl).mockReturnValue("publicId");
      vi.mocked(prisma.post.delete).mockResolvedValue(
        mockResourcePostInDb as any
      );

      await deletePost(mockReq, mockRes);

      expect(deleteFromCloudinary).toHaveBeenCalledWith("publicId", "raw");
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe("File Cleanup Logic", () => {
    it("should skip file cleanup for RESOURCE posts without a fileUrl", async () => {
      const resourcePostNoFile = {
        ...mockPostInDb,
        type: "RESOURCE",
        fileUrl: null,
        fileName: null,
      };

      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        resourcePostNoFile as any
      );
      vi.mocked(prisma.post.delete).mockResolvedValue(
        resourcePostNoFile as any
      );

      await deletePost(mockReq, mockRes);

      expect(extractPublicIdFromUrl).not.toHaveBeenCalled();
      expect(deleteFromCloudinary).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should skip file cleanup for non-RESOURCE post types", async () => {
      const textPost = {
        ...mockPostInDb,
        type: "TEXT",
        fileUrl: "http://cloudinary.com/image/upload/v12345/publicId.jpg",
        fileName: "document.pdf",
      };

      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(textPost as any);
      vi.mocked(prisma.post.delete).mockResolvedValue(textPost as any);

      await deletePost(mockReq, mockRes);

      expect(extractPublicIdFromUrl).not.toHaveBeenCalled();
      expect(deleteFromCloudinary).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should continue with deletion even if extractPublicIdFromUrl returns null", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        mockResourcePostInDb as any
      );
      vi.mocked(extractPublicIdFromUrl).mockReturnValue(null);
      vi.mocked(prisma.post.delete).mockResolvedValue(
        mockResourcePostInDb as any
      );

      await deletePost(mockReq, mockRes);

      expect(extractPublicIdFromUrl).toHaveBeenCalledWith(
        mockResourcePostInDb.fileUrl
      );
      expect(deleteFromCloudinary).not.toHaveBeenCalled();
      expect(prisma.post.delete).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should continue with deletion even if extractPublicIdFromUrl returns empty string", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        mockResourcePostInDb as any
      );
      vi.mocked(extractPublicIdFromUrl).mockReturnValue("");
      vi.mocked(prisma.post.delete).mockResolvedValue(
        mockResourcePostInDb as any
      );

      await deletePost(mockReq, mockRes);

      expect(deleteFromCloudinary).not.toHaveBeenCalled();
      expect(prisma.post.delete).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should continue with post deletion even if Cloudinary deletion fails", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };

      const cloudinaryError = new Error("Cloudinary service unavailable");

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        mockResourcePostInDb as any
      );
      vi.mocked(extractPublicIdFromUrl).mockReturnValue("publicId");
      vi.mocked(deleteFromCloudinary).mockRejectedValue(cloudinaryError);
      vi.mocked(prisma.post.delete).mockResolvedValue(
        mockResourcePostInDb as any
      );

      await deletePost(mockReq, mockRes);

      expect(deleteFromCloudinary).toHaveBeenCalledWith("publicId", "raw");
      expect(prisma.post.delete).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Post deleted successfully",
      });
    });

    it("should handle Cloudinary deletion with non-Error thrown values", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        mockResourcePostInDb as any
      );
      vi.mocked(extractPublicIdFromUrl).mockReturnValue("publicId");
      vi.mocked(deleteFromCloudinary).mockRejectedValue("String error");
      vi.mocked(prisma.post.delete).mockResolvedValue(
        mockResourcePostInDb as any
      );

      await deletePost(mockReq, mockRes);

      expect(prisma.post.delete).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Error Handling", () => {
    it("should call handleError if database findUnique operation fails", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };

      const mockError = new Error("Database connection error");
      vi.mocked(prisma.post.findUnique).mockRejectedValue(mockError);

      await deletePost(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(mockError, mockRes);
      expect(prisma.post.delete).not.toHaveBeenCalled();
    });

    it("should call handleError if database delete operation fails", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };

      const mockError = new Error("Database delete error");

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostInDb as any);
      vi.mocked(prisma.post.delete).mockRejectedValue(mockError);

      await deletePost(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(mockError, mockRes);
    });

    it("should call handleError if PostIdParamSchema validation fails", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: "invalid-uuid" };

      await deletePost(mockReq, mockRes);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.post.findUnique).not.toHaveBeenCalled();
    });

    it("should call handleError if params.id is missing", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = {};

      await deletePost(mockReq, mockRes);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.post.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle RESOURCE post with fileUrl but without fileName", async () => {
      const postWithoutFileName = {
        ...mockPostInDb,
        type: "RESOURCE",
        fileUrl: "http://cloudinary.com/image/upload/v12345/publicId.jpg",
        fileName: null,
      };

      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        postWithoutFileName as any
      );
      vi.mocked(extractPublicIdFromUrl).mockReturnValue("publicId");
      vi.mocked(prisma.post.delete).mockResolvedValue(
        postWithoutFileName as any
      );

      await deletePost(mockReq, mockRes);

      expect(deleteFromCloudinary).toHaveBeenCalledWith("publicId", "raw");
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should handle post with empty string fileUrl", async () => {
      const postWithEmptyFileUrl = {
        ...mockPostInDb,
        type: "RESOURCE",
        fileUrl: "",
        fileName: "document.pdf",
      };

      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        postWithEmptyFileUrl as any
      );
      vi.mocked(prisma.post.delete).mockResolvedValue(
        postWithEmptyFileUrl as any
      );

      await deletePost(mockReq, mockRes);

      expect(extractPublicIdFromUrl).not.toHaveBeenCalled();
      expect(deleteFromCloudinary).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should handle different post types correctly", async () => {
      const postTypes = ["TEXT", "POLL", "ANNOUNCEMENT", "RESOURCE"];

      for (const type of postTypes) {
        vi.clearAllMocks();

        const post = {
          ...mockPostInDb,
          type,
          fileUrl: type === "RESOURCE" ? mockResourcePostInDb.fileUrl : null,
          fileName: type === "RESOURCE" ? "file.pdf" : null,
        };

        mockReq.user = createAuthenticatedUser({ id: mockUserId });
        mockReq.params = { id: mockPostId };

        vi.mocked(prisma.post.findUnique).mockResolvedValue(post as any);
        vi.mocked(extractPublicIdFromUrl).mockReturnValue("publicId");
        vi.mocked(prisma.post.delete).mockResolvedValue(post as any);

        await deletePost(mockReq, mockRes);

        if (type === "RESOURCE") {
          expect(extractPublicIdFromUrl).toHaveBeenCalled();
        } else {
          expect(extractPublicIdFromUrl).not.toHaveBeenCalled();
        }

        expect(mockRes.status).toHaveBeenCalledWith(200);
      }
    });

    it("should handle concurrent deletion attempts gracefully", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };

      const concurrencyError = new Error("Record not found");
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostInDb as any);
      vi.mocked(prisma.post.delete).mockRejectedValue(concurrencyError);

      await deletePost(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(concurrencyError, mockRes);
    });
  });

  describe("Permission Checks", () => {
    it("should verify permission check is called before deletion", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostInDb as any);
      vi.mocked(prisma.post.delete).mockResolvedValue(mockPostInDb as any);

      await deletePost(mockReq, mockRes);

      expect(prisma.post.findUnique).toHaveBeenCalledBefore(
        prisma.post.delete as any
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should not delete post if authorization fails before database operations", async () => {
      const differentUserId = "different-user-id";
      mockReq.user = createAuthenticatedUser({ id: differentUserId });
      mockReq.params = { id: mockPostId };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostInDb as any);

      await deletePost(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthorizationError),
        mockRes
      );
      expect(prisma.post.delete).not.toHaveBeenCalled();
      expect(deleteFromCloudinary).not.toHaveBeenCalled();
    });
  });
});
