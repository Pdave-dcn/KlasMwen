import { faker } from "@faker-js/faker";

import prisma from "../../core/config/db.js";
import { createLogger } from "../../core/config/logger.js";
import { handleSeedingError } from "../utils/seedHelpers.js";

import type { User, Post } from "@prisma/client";

const logger = createLogger({ module: "BookmarksSeeder" });

interface BookmarkSeedingOptions {
  minBookmarksPerPost?: number;
  maxBookmarksPerPost?: number;
  bookmarkProbability?: number;
}

interface BookmarkStats {
  totalBookmarks: number;
  avgBookmarksPerPost: number;
  avgBookmarksPerUser: number;
  mostBookmarkedPost: {
    postId: string | null;
    bookmarks: number;
  };
  bookmarkSeedingDuration: number;
  distribution: {
    postsWithBookmarks: number;
    usersWhoBookmarked: number;
    totalPosts: number;
    totalUsers: number;
  };
}

interface BookmarkToCreate {
  userId: string;
  postId: string;
}

/** Exclude the author so they can’t bookmark their own post */
const getEligibleUsers = (users: User[], post: Post): User[] => {
  return users.filter((u) => u.id !== post.authorId);
};

/** Generate bookmarks for a single post */
const pickBookmarksForPost = (
  post: Post,
  eligibleUsers: User[],
  options: BookmarkSeedingOptions
): BookmarkToCreate[] => {
  const {
    minBookmarksPerPost = 0,
    maxBookmarksPerPost = Math.min(eligibleUsers.length, 5),
    bookmarkProbability = 0.2,
  } = options;

  const targetBookmarks = faker.number.int({
    min: minBookmarksPerPost,
    max: maxBookmarksPerPost,
  });
  const postBookmarks = new Set<string>();
  const bookmarks: BookmarkToCreate[] = [];

  let attempts = 0;
  while (
    postBookmarks.size < targetBookmarks &&
    attempts < 10 * targetBookmarks
  ) {
    const randomUser = faker.helpers.arrayElement(eligibleUsers);

    if (
      Math.random() < bookmarkProbability &&
      !postBookmarks.has(randomUser.id)
    ) {
      postBookmarks.add(randomUser.id);
      bookmarks.push({ userId: randomUser.id, postId: post.id });
    }
    attempts++;
  }

  return bookmarks;
};

/** Create bookmarks in batches with fallback for failures */
const createBookmarksInBatches = async (
  bookmarks: BookmarkToCreate[],
  batchSize = 100
): Promise<number> => {
  let createdCount = 0;

  for (let i = 0; i < bookmarks.length; i += batchSize) {
    const batch = bookmarks.slice(i, i + batchSize);

    try {
      await prisma.bookmark.createMany({
        data: batch,
        skipDuplicates: true,
      });
      createdCount += batch.length;
    } catch (error) {
      logger.warn(
        {
          batchStart: i,
          batchSize: batch.length,
          error: (error as Error).message,
        },
        "Failed batch insert, retrying individually"
      );

      for (const bookmark of batch) {
        try {
          await prisma.bookmark.create({ data: bookmark });
          createdCount++;
        } catch (individualError) {
          logger.debug(
            { ...bookmark, error: (individualError as Error).message },
            "Skipped individual bookmark creation"
          );
        }
      }
    }
  }

  return createdCount;
};

/** Compute final statistics */
const computeBookmarkStats = (
  users: User[],
  posts: Post[],
  bookmarks: BookmarkToCreate[],
  createdCount: number,
  startTime: number
): BookmarkStats => {
  const bookmarkSeedingDuration = Date.now() - startTime;
  const bookmarksByPost: Record<string, number> = {};
  const bookmarksByUser: Record<string, number> = {};

  for (const bookmark of bookmarks) {
    bookmarksByPost[bookmark.postId] =
      (bookmarksByPost[bookmark.postId] || 0) + 1;
    bookmarksByUser[bookmark.userId] =
      (bookmarksByUser[bookmark.userId] || 0) + 1;
  }

  const mostBookmarkedPost = Object.entries(bookmarksByPost).reduce(
    (max, [postId, count]) =>
      count > max.bookmarks ? { postId, bookmarks: count } : max,
    { postId: null as string | null, bookmarks: 0 }
  );

  return {
    totalBookmarks: createdCount,
    avgBookmarksPerPost: posts.length
      ? parseFloat((createdCount / posts.length).toFixed(2))
      : 0,
    avgBookmarksPerUser: users.length
      ? parseFloat((createdCount / users.length).toFixed(2))
      : 0,
    mostBookmarkedPost,
    bookmarkSeedingDuration,
    distribution: {
      postsWithBookmarks: Object.keys(bookmarksByPost).length,
      usersWhoBookmarked: Object.keys(bookmarksByUser).length,
      totalPosts: posts.length,
      totalUsers: users.length,
    },
  };
};

/**
 * Seeds bookmarks for posts with realistic engagement patterns.
 *
 * @param {User[]} users - Array of user objects
 * @param {Post[]} posts - Array of post objects
 * @param {BookmarkSeedingOptions} [options={}] - Seeding configuration options
 * @return {Promise<BookmarkStats>} Statistics about created bookmarks and seeding performance
 * @throws {SeedingError} When seeding fails
 */
const seedBookmarks = async (
  users: User[],
  posts: Post[],
  options: BookmarkSeedingOptions = {}
) => {
  const seedingStartTime = Date.now();
  logger.info("Starting bookmark seeding process");

  try {
    const bookmarksToCreate: BookmarkToCreate[] = [];

    for (const post of posts) {
      const eligibleUsers = getEligibleUsers(users, post);
      const postBookmarks = pickBookmarksForPost(post, eligibleUsers, options);
      bookmarksToCreate.push(...postBookmarks);
    }

    logger.info(`Prepared ${bookmarksToCreate.length} bookmarks to insert`);
    const createdCount = await createBookmarksInBatches(bookmarksToCreate);

    const bookmarkStats = computeBookmarkStats(
      users,
      posts,
      bookmarksToCreate,
      createdCount,
      seedingStartTime
    );
    logger.info(
      bookmarkStats,
      `Successfully created ${bookmarkStats.totalBookmarks} bookmarks`
    );

    return bookmarkStats;
  } catch (error) {
    return handleSeedingError(error, logger, "Bookmark seeding", "bookmarks", {
      usersCount: users?.length || 0,
      postsCount: posts?.length || 0,
      duration: Date.now() - seedingStartTime,
    });
  }
};

export default seedBookmarks;
