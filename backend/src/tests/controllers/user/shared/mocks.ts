import type { User, Role } from "@prisma/client";
import type { Request, Response } from "express";

const mockUser: User = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  username: "testuser",
  password: "hash-password",
  email: "test@example.com",
  bio: "Test bio",
  avatarId: 1,
  role: "STUDENT" as Role,
  createdAt: new Date("2023-01-01"),
};

const createMockRequest = (overrides = {}) =>
  ({
    params: {},
    body: {},
    query: {},
    user: undefined,
    ...overrides,
  } as Request);

const createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

export { mockUser, createMockRequest, createMockResponse };
