import { it, expect, describe, vi, beforeEach } from "vitest";
import { ZodError } from "zod";

import { createReport } from "../../../src/controllers/report/report.user.controller.js";

const mockCreateReport = vi.fn();

vi.mock("../../../src/features/report/service/index.js", () => ({
  reportService: {
    createReport: (...args: unknown[]) => mockCreateReport(...args),
  },
}));

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
}));

type MockReq = Record<string, unknown>;
type MockRes = {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};
type MockNext = ReturnType<typeof vi.fn>;

function createReq(overrides: Record<string, unknown> = {}): MockReq {
  return { params: {}, body: {}, query: {}, ...overrides };
}

function createRes(): MockRes {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

const mockUser = {
  id: "910da3f7-f419-4929-b775-6e26ba17f248",
  username: "testUser",
  email: "test@example.com",
  role: "STUDENT",
};

describe("Report User Controller", () => {
  let mockRequest: MockReq;
  let mockResponse: MockRes;
  let mockNext: MockNext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = createRes();
    mockNext = vi.fn();
  });

  describe("createReport", () => {
    const mockCreatedReport = {
      id: 1,
      reason: { label: "Spam" },
      reporter: { username: "testUser" },
    };

    it("should create a post report successfully", async () => {
      mockRequest = createReq({
        user: mockUser,
        body: { postId: "6b2efb09-e634-41d9-b2eb-d4972fabb729", reasonId: 1 },
      });
      mockCreateReport.mockResolvedValue(mockCreatedReport);

      await createReport(mockRequest as any, mockResponse as any, mockNext);

      expect(mockCreateReport).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({ postId: "6b2efb09-e634-41d9-b2eb-d4972fabb729", reasonId: 1 }),
      );
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Report successfully created",
      });
    });

    it("should create a comment report successfully", async () => {
      mockRequest = createReq({
        user: mockUser,
        body: { commentId: 123, reasonId: 1 },
      });
      mockCreateReport.mockResolvedValue(mockCreatedReport);

      await createReport(mockRequest as any, mockResponse as any, mockNext);

      expect(mockCreateReport).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({ commentId: 123, reasonId: 1 }),
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it("should call next with ZodError for empty body", async () => {
      mockRequest = createReq({ user: mockUser, body: {} });

      await createReport(mockRequest as any, mockResponse as any, mockNext);

      expect(mockCreateReport).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it("should call next with ZodError when both postId and commentId provided", async () => {
      mockRequest = createReq({
        user: mockUser,
        body: {
          postId: "6b2efb09-e634-41d9-b2eb-d4972fabb729",
          commentId: 123,
          reasonId: 1,
        },
      });

      await createReport(mockRequest as any, mockResponse as any, mockNext);

      expect(mockCreateReport).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it("should call next with service error when post not found", async () => {
      mockRequest = createReq({
        user: mockUser,
        body: { postId: "6b2efb09-e634-41d9-b2eb-d4972fabb729", reasonId: 1 },
      });
      mockCreateReport.mockRejectedValue(new Error("Post not found"));

      await createReport(mockRequest as any, mockResponse as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
