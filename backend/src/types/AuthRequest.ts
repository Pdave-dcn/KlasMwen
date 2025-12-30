import type { Role } from "@prisma/client";
import type { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    username: string;
    email: string;
    role: Role;
  };
}
