import { it, expect, describe, vi, beforeEach } from "vitest";

import { getReportReasons } from "../../../src/controllers/report/report.public.controller.js";

const mockGetReportReasons = vi.fn();

vi.mock("../../../src/features/report/service/index.js", () => ({
  reportService: {
    getReportReasons: (...args: unknown[]) => mockGetReportReasons(...args),
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

describe("Report Public Controller", () => {
  let mockRequest: MockReq;
  let mockResponse: MockRes;
  let mockNext: MockNext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = createRes();
    mockNext = vi.fn();
  });

  describe("getReportReasons", () => {
    const mockReasons = [
      { id: 1, label: "Spam", description: "Spam content" },
      { id: 2, label: "Harassment", description: "Harassing behavior" },
    ];

    it("should return active report reasons", async () => {
      mockRequest = createReq();
      mockGetReportReasons.mockResolvedValue(mockReasons);

      await getReportReasons(mockRequest as any, mockResponse as any, mockNext);

      expect(mockGetReportReasons).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ data: mockReasons });
    });

    it("should return empty array when no reasons exist", async () => {
      mockRequest = createReq();
      mockGetReportReasons.mockResolvedValue([]);

      await getReportReasons(mockRequest as any, mockResponse as any, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ data: [] });
    });
  });
});
