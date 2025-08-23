import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import prisma from "../../core/config/db.js";
import { createLogger } from "../../core/config/logger.js";
import { handleError } from "../../core/error/index.js";
import { getRandomDefaultAvatar } from "../../features/avatar/avatarService.js";
import createActionLogger from "../../utils/logger.util.js";
import RegisterUserSchema from "../../zodSchemas/register.zod.js";

import type { Request, Response } from "express";

// Create base loggers
const controllerLogger = createLogger({ module: "AuthController" });
const serviceLogger = createLogger({ service: "UserService" });

// Service functions
class UserService {
  static async hashPassword(password: string): Promise<string> {
    const methodLogger = serviceLogger.child({ method: "hashPassword" });

    try {
      methodLogger.debug("Starting password hash");
      const startTime = Date.now();

      const hashedPassword = await bcrypt.hash(password, 12);

      const duration = Date.now() - startTime;
      methodLogger.debug({ duration }, "Password hashed successfully");

      return hashedPassword;
    } catch (error) {
      methodLogger.error(
        {
          errorType:
            error instanceof Error ? error.constructor.name : typeof error,
          errorDescription:
            error instanceof Error ? error.message : String(error),
        },
        "Password hashing failed"
      );
      throw error;
    }
  }

  static async createUser(userData: {
    username: string;
    email: string;
    password: string;
    avatarId: number;
  }) {
    const methodLogger = serviceLogger.child({
      method: "createUser",
      username: userData.username,
    });

    methodLogger.info("Creating new user");
    const startTime = Date.now();

    const newUser = await prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        avatarId: userData.avatarId,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const dbDuration = Date.now() - startTime;
    methodLogger.info(
      {
        userId: newUser.id,
        role: newUser.role,
        dbDuration,
      },
      "User created successfully"
    );

    return newUser;
  }

  static generateToken(userData: {
    id: string;
    username: string;
    email: string;
    role: string;
  }): string {
    const methodLogger = serviceLogger.child({
      method: "generateToken",
      userId: userData.id,
      username: userData.username,
      role: userData.role,
    });

    try {
      methodLogger.debug("Generating JWT token");

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        methodLogger.error("JWT_SECRET not defined in environment variables");
        throw new Error("JWT_SECRET not defined in environment variables");
      }

      const token = jwt.sign(
        {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          role: userData.role,
        },
        jwtSecret,
        { expiresIn: "3d" }
      );

      methodLogger.info("JWT token generated successfully");
      return token;
    } catch (error) {
      methodLogger.error(
        {
          errorType:
            error instanceof Error ? error.constructor.name : typeof error,
          errorDescription:
            error instanceof Error ? error.message : String(error),
        },
        "Token generation failed"
      );
      throw error;
    }
  }
}

// Controller - focuses on orchestration
const registerUser = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "registerUser",
    req
  );

  try {
    actionLogger.info(`User registration attempt started`);
    const startTime = Date.now();

    actionLogger.debug("Validating request body");
    const { email, username, password } = RegisterUserSchema.parse(req.body);

    const emailDomain = email.split("@")[1];
    actionLogger.info(
      `Registration data validated (username: ${username}, emailDomain: ${emailDomain})`
    );

    actionLogger.debug("Hashing password");
    const passwordHash = await UserService.hashPassword(password);

    actionLogger.debug("Retrieving user default avatar");
    const avatar = await getRandomDefaultAvatar();

    actionLogger.debug("Creating user in database");
    const newUser = await UserService.createUser({
      username,
      email,
      password: passwordHash,
      avatarId: avatar.id,
    });

    actionLogger.debug("Generating authentication token");
    const token = UserService.generateToken(newUser);

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        userId: newUser.id,
        username: newUser.username,
        role: newUser.role,
        totalDuration,
      },
      "User registration completed successfully"
    );

    return res.status(201).json({
      message: "User registered successfully",
      user: newUser,
      token,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export { UserService, registerUser };
