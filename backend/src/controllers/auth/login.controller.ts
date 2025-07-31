import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { UserService } from "./register.controller.js";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

// Authentication callback
const handleAuthenticationResult = (
  res: Response,
  next: NextFunction,
  error: Error | null,
  user: User | false | null,
  info: { message: string } | undefined
) => {
  try {
    if (error) {
      return next(error);
    }

    if (!user) {
      return res.status(401).json({
        message: info?.message || "Invalid credentials",
      });
    }

    const token = UserService.generateToken(user);

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (tokenError) {
    console.error("Error generating token:", tokenError);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Controller
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  passport.authenticate(
    "local",
    { session: false },
    (
      error: Error | null,
      user: User | false | null,
      info: { message: string } | undefined
    ) => handleAuthenticationResult(res, next, error, user, info)
  )(req, res, next);
};
