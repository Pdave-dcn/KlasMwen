import type { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      email: string;
      role: Role;
    }

    interface Request {
      user?: User;
    }
  }
}
