import type { UpdateUserProfileData } from "../../../../zodSchemas/user.zod.js";
import type { Prisma } from "@prisma/client";

const UserFragments = {
  avatar: {
    select: {
      id: true,
      url: true,
    },
  },
} as const;

const BaseSelectors = {
  user: {
    id: true,
    username: true,
    bio: true,
    role: true,
    Avatar: UserFragments.avatar,
  } satisfies Prisma.UserSelect,

  userExtended: {
    id: true,
    username: true,
    bio: true,
    role: true,
    Avatar: UserFragments.avatar,
    email: true,
    createdAt: true,
  } satisfies Prisma.UserSelect,
};

interface RegisterUserData {
  username: string;
  email: string;
  password: string;
}

interface CreateUserData {
  username: string;
  email: string;
  password: string;
  avatarId: number;
}
interface AuthTokenPayload {
  id: string;
  username: string;
  email: string;
  role: string;
}

export type {
  UpdateUserProfileData,
  RegisterUserData,
  CreateUserData,
  AuthTokenPayload,
};
export { BaseSelectors };
