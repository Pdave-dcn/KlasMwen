import { Role } from "@prisma/client";

import { createMockRequest, createMockResponse } from "./mocks";

import type { NextFunction, Request, Response } from "express";
import { expect, vi } from "vitest";

type Controller = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

async function expectValidationError(
  controller: Controller,
  reqOverrides: Partial<Request>,
): Promise<void> {
  const req = createMockRequest(reqOverrides);
  const res = createMockResponse();
  const next = vi.fn();

  await controller(req, res, next);

  expect(next).toHaveBeenCalled();
}

const createAuthenticatedUser = (overrides = {}) => ({
  id: "123e4567-e89b-12d3-a456-426614174000",
  username: "testuser",
  email: "test@example.com",
  role: "STUDENT" as Role,
  ...overrides,
});

export { expectValidationError, createAuthenticatedUser };
