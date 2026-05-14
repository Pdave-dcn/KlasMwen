import type { CircleRole, Role } from "@prisma/client";

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      email: string;
      role: Role;
      circleRole?: CircleRole;
    }

    interface LogContext {
      requestId: string;
      module: string;
      [key: string]: unknown;
    }

    interface Request {
      user?: User;
      logContext?: LogContext;
    }
  }
}
