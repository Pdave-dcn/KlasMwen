import { Role } from "@prisma/client";

const createAuthenticatedUser = (overrides = {}) => ({
  id: "123e4567-e89b-12d3-a456-426614174000",
  username: "testUser",
  email: "test@example.com",
  role: "STUDENT" as Role,
  ...overrides,
});

export { createAuthenticatedUser };
