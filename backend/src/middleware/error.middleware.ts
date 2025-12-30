import { handleError } from "../core/error";

import type {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";

export const errorMiddleware: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(err);
  }

  handleError(err, res);
};
