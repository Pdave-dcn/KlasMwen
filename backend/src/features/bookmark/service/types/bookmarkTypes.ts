import type { Prisma } from "@prisma/client";

const BaseSelectors = {
  bookmark: {
    userId: true,
    postId: true,
    createdAt: true,
  } satisfies Prisma.BookmarkSelect,
} as const;

type BaseBookmark = Prisma.BookmarkGetPayload<{
  select: typeof BaseSelectors.bookmark;
}>;

export { BaseSelectors };
export type { BaseBookmark };
