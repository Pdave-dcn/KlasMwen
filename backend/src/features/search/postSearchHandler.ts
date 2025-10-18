import prisma from "../../core/config/db";

import type { Prisma } from "@prisma/client";

/**
 * Searches for posts based on a search term with cursor-based pagination.
 * Performs case-insensitive search across post titles and content using OR logic.
 * Executes parallel queries for both post retrieval and total count for optimal performance.
 *
 * @param {string} searchTerm - The search query to match against post titles and content
 * @param {number} limit - Maximum number of posts to retrieve (actual query fetches limit + 1 for pagination)
 * @param {string} [cursor] - Optional cursor ID for pagination, represents the last post ID from previous page
 * @return {Promise<{posts: Array, totalCount: number}>} Object containing array of matching posts with author/tag data and total count of all matching posts
 */
const handlePostSearch = async (
  searchTerm: string,
  limit: number,
  cursor?: string
) => {
  const searchCondition: Prisma.PostWhereInput = {
    OR: [
      {
        title: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        content: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
    ],
  };

  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where: searchCondition,
      select: {
        id: true,
        title: true,
        type: true,
        content: true,
        fileUrl: true,
        fileName: true,
        createdAt: true,
        postTags: { include: { tag: true } },
        author: {
          select: {
            id: true,
            username: true,
            Avatar: {
              select: {
                id: true,
                url: true,
              },
            },
          },
        },
        _count: { select: { comments: true, likes: true } },
      },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: [{ createdAt: "desc" }],
    }),

    prisma.post.count({
      where: searchCondition,
    }),
  ]);

  return { posts, totalCount };
};

export default handlePostSearch;
