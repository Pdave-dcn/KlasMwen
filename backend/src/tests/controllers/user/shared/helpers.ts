import { Role } from "@prisma/client";

import prisma from "../../../../core/config/db.js";
import { handleError } from "../../../../core/error/index.js";

import { createMockRequest, createMockResponse } from "./mocks";

import type { Request, Response } from "express";

type Controller = (
  req: Request,
  res: Response
) => Promise<Response<any, Record<string, any>> | undefined>;

async function expectValidationError(
  controller: Controller,
  reqOverrides: Partial<Request>,
  shouldCheckPrisma: boolean = true
): Promise<void> {
  const req = createMockRequest(reqOverrides);
  const res = createMockResponse();

  await controller(req, res);

  expect(handleError).toHaveBeenCalled();

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
