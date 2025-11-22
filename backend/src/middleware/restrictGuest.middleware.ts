import type { NextFunction, Request, Response } from "express";

export const restrictGuest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role === "GUEST") {
    return res.status(403).json({
      message: "Guest users are not allowed to perform this action",
    });
  }

  return next();
};
