import z from "zod";

import prisma from "../config/db.js";
import { handleError } from "../lib/errorHandler.js";

import type { Response, Request } from "express";

const UserIdParamSchema = z.object({
  id: z.uuid("Invalid user ID format in URL parameter."),
});

const UpdateUserProfileSchema = z.object({
  bio: z
    .string()
    .max(160, "Bio must be less than 500 characters.")
    .optional()
    .or(z.literal("")),

  avatarUrl: z
    .string()
    .regex(
      /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i,
      "Avatar URL must be a valid image URL."
    )
    .optional()
    .or(z.literal("")),
});

const getUserById = async (req: Request, res: Response) => {
  try {
    const { id: userId } = UserIdParamSchema.parse(req.params);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json(user);
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { bio, avatarUrl } = UpdateUserProfileSchema.parse(req.body);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { bio, avatarUrl },
    });

    return res.json({ message: "Profile updated", user: updated });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getMyPosts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      include: {
        postTags: true,
        comments: true,
        likes: true,
      },
    });

    return res.json(posts);
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export { getUserById, updateUserProfile, getMyPosts };
