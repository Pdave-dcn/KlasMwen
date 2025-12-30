import { getCookieConfig } from "../../core/config/cookie.js";
import { createLogger } from "../../core/config/logger.js";
import UserService from "../../features/user/service/UserService.js";
import createActionLogger from "../../utils/logger.util.js";
import RegisterUserSchema from "../../zodSchemas/register.zod.js";

import type { Request, Response, NextFunction } from "express";

const controllerLogger = createLogger({ module: "AuthController" });

/**
 * Controller for user registration
 * Handles request validation and response formatting
 */
const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "registerUser",
    req
  );

  try {
    actionLogger.info("User registration attempt started");
    const startTime = Date.now();

    const validatedData = RegisterUserSchema.parse(req.body);

    // Call service layer
    const { user, token } = await UserService.registerUser(validatedData);

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        totalDuration,
      },
      "User registration completed successfully"
    );

    // Set cookie
    res.cookie("token", token, getCookieConfig());

    // Send response
    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error: unknown) {
    return next(error);
  }
};

export { registerUser };
