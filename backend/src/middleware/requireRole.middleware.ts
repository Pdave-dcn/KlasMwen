import type { AuthenticatedRequest } from "../types/AuthRequest.js";
import type { Role } from "@prisma/client";
import type { Request, Response, NextFunction } from "express";

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      req.log.warn(
        {
          path: req.originalUrl,
        },
        "Authorization attempted without authenticated user"
      );

      res.status(403).json({ message: "Access denied" });
      return;
    }

    if (!roles.includes(user.role)) {
      req.log.warn(
        {
          userId: user.id,
          role: user.role,
          requiredRoles: roles,
          path: req.originalUrl,
        },
        "Authorization denied"
      );

      res.status(403).json({ message: "Access denied" });
      return;
    }

    req.log.info(
      {
        userId: user.id,
        role: user.role,
      },
      "Authorization granted"
    );

    next();
  };
