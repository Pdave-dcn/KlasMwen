import type { CircleRole, Role } from "@prisma/client";
import type { Request } from "express";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    username: string;
    email: string;
    role: Role;
  };
}

interface AuthenticatedEnrichedRequest extends Request {
  user: {
    id: string;
    username: string;
    email: string;
    role: Role;
    circleRole: CircleRole;
  };
}

export { AuthenticatedRequest, AuthenticatedEnrichedRequest };
