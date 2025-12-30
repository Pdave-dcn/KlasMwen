import { Role } from "@prisma/client";

import prisma from "../../../../src/core/config/db.js";
import { handleError } from "../../../../src/core/error/index.js";

import { createMockRequest, createMockResponse } from "./mocks";

import type { Request, Response, NextFunction } from "express";
import { expect, vi } from "vitest";

type Controller = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;

async function expectValidationError(
  controller: Controller,
  reqOverrides: Partial<Request>,
  shouldCheckPrisma: boolean = true
): Promise<void> {
  const req = createMockRequest(reqOverrides);
  const res = createMockResponse();
  const next = vi.fn();

  await controller(req, res, next);

  expect(next).toHaveBeenCalled();
  if (shouldCheckPrisma) {
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  }
}

const createAuthenticatedUser = (overrides = {}) => ({
  id: "123e4567-e89b-12d3-a456-426614174000",
  username: "testuser",
  email: "test@example.com",
  role: "STUDENT" as Role,
  ...overrides,
});

export { expectValidationError, createAuthenticatedUser };
