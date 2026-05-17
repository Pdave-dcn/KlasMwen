import type { Prisma } from "@prisma/client";

const BaseSelectors = {
  avatar: {
    id: true,
    url: true,
    isDefault: true,
  } satisfies Prisma.AvatarSelect,
} as const;

type BaseAvatar = Prisma.AvatarGetPayload<{
  select: typeof BaseSelectors.avatar;
}>;

interface CreateAvatarInput {
  url: string;
  isDefault?: boolean;
}

export { BaseSelectors };
export type { BaseAvatar, CreateAvatarInput };
