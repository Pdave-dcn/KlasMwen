import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../../config/db.js";
import jwt from "jsonwebtoken";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

// Registration-specific schema
const RegisterUserSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required.")
    .min(3, "Username must be at least 3 characters.")
    .max(50, "Username must be less than 50 characters.")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens."
    ),

  email: z
    .string()
    .min(1, "Email is required.")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address."),

  password: z
    .string()
    .min(1, "Password is required.")
    .min(8, "Password must be at least 8 characters.")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number."
    ),
});

// Service functions
export class UserService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async createUser(userData: {
    username: string;
    email: string;
    password: string;
  }) {
    return prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        password: userData.password,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  static generateToken(userData: {
    id: string;
    username: string;
    email: string;
    role: string;
  }): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET not defined in environment variables");
    }

    return jwt.sign(
      {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
      },
      jwtSecret,
      { expiresIn: "3d" }
    );
  }
}

// Error handling utilities
export class ErrorHandler {
  static handleValidationError(error: z.ZodError) {
    return {
      status: 400,
      response: {
        message: "Validation failed",
        errors: error.issues.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        })),
      },
    };
  }

  static handlePrismaError(error: PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const field = error.meta?.target as string[];
      const fieldName = field?.[0] === "username" ? "username" : "email";
      return {
        status: 409,
        response: {
          message: `User with this ${fieldName} already exists.`,
        },
      };
    }

    console.error("Prisma Error:", error.message);
    return {
      status: 500,
      response: { message: "Internal server error" },
    };
  }

  static handleGenericError(error: unknown) {
    console.error("Error creating user:", error);
    return {
      status: 500,
      response: { message: "Internal server error" },
    };
  }
}

// Controller - focuses on orchestration
export const registerUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const validatedBody = RegisterUserSchema.parse(req.body);

    const passwordHash = await UserService.hashPassword(validatedBody.password);

    const newUser = await UserService.createUser({
      username: validatedBody.username,
      email: validatedBody.email,
      password: passwordHash,
    });

    const token = UserService.generateToken(newUser);

    return res.status(201).json({
      message: "User created successfully",
      user: newUser,
      token,
    });
  } catch (error: unknown) {
    let errorResponse;

    if (error instanceof z.ZodError) {
      errorResponse = ErrorHandler.handleValidationError(error);
    } else if (error instanceof PrismaClientKnownRequestError) {
      errorResponse = ErrorHandler.handlePrismaError(error);
    } else {
      errorResponse = ErrorHandler.handleGenericError(error);
    }

    return res.status(errorResponse.status).json(errorResponse.response);
  }
};
