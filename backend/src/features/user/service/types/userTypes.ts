import type { UpdateUserProfileData } from "../../../../zodSchemas/user.zod";
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

export type { UpdateUserProfileData };
export { BaseSelectors };
