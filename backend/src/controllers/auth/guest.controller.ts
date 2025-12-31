import jwt from "jsonwebtoken";

import prisma from "../../core/config/db.js";
import env from "../../core/config/env.js";

import type { NextFunction, Request, Response } from "express";

export const loginGuest = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const guestEmail = env.GUEST_EMAIL;

    const user = await prisma.user.findUnique({
      where: { email: guestEmail },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        Avatar: {
          select: { id: true, url: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Guest user not found" });
    }

    if (user.role !== "GUEST") {
      return res.status(403).json({
        message: "Invalid configuration: guest user does not have GUEST role",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const isProduction = env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 60 * 60 * 1000,
      path: "/",
    });

    return res.json({
      message: "Guest login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.Avatar,
      },
    });
  } catch (error: unknown) {
    return next(error);
  }
};
