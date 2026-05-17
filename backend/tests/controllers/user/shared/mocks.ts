import type { Request, Response } from "express";
import { vi } from "vitest";

const mockUser = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  username: "testuser",
  email: "test@example.com",
  role: "STUDENT",
};

const createMockRequest = (overrides = {}) =>
  ({
    params: {},
    body: {},
    query: {},
    user: undefined,
    ...overrides,
  }) as unknown as Request;

const createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

export { mockUser, createMockRequest, createMockResponse };
