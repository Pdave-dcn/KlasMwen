import { faker } from "@faker-js/faker";

import prisma from "../../core/config/db.js";
import { createLogger } from "../../core/config/logger.js";
import { handleSeedingError } from "../utils/seedHelpers.js";

import type { User, Post } from "@prisma/client";

const logger = createLogger({ module: "LikesSeeder" });

interface LikeSeedingOptions {
  minLikesPerPost?: number;
  maxLikesPerPost?: number;
  likeProbability?: number;
}

interface LikeStats {
  totalLikes: number;
  avgLikesPerPost: number;
  avgLikesPerUser: number;
  mostLikedPost: {
    postId: string | null;
    likes: number;
  };
  mostActiveUser: {
    userId: string | null;
    likes: number;
  };
  likeSeedingDuration: number;
  distribution: {
    postsWithLikes: number;
    usersWhoLiked: number;
    totalPosts: number;
    totalUsers: number;
  };
}

interface LikeToCreate {
  userId: string;
  postId: string;
}

/** Exclude the author so they can’t like their own post */
const getEligibleUsers = (users: User[], post: Post): User[] => {
  return users.filter((u) => u.id !== post.authorId);
};

/** Generate likes for a single post */
const pickLikesForPost = (
  post: Post,
  eligibleUsers: User[],
  options: LikeSeedingOptions
): LikeToCreate[] => {
  const {
    minLikesPerPost = 0,
    maxLikesPerPost = Math.min(eligibleUsers.length, 8),
    likeProbability = 0.3,
  } = options;

  const targetLikes = faker.number.int({
    min: minLikesPerPost,
    max: maxLikesPerPost,
  });
  const postLikes = new Set<string>();
  const likes: LikeToCreate[] = [];

  let attempts = 0;
  while (postLikes.size < targetLikes && attempts < 10 * targetLikes) {
    const randomUser = faker.helpers.arrayElement(eligibleUsers);

    if (Math.random() < likeProbability && !postLikes.has(randomUser.id)) {
      postLikes.add(randomUser.id);
      likes.push({ userId: randomUser.id, postId: post.id });
    }
    attempts++;
  }

  return likes;
};

/** Create likes in batches with fallback for failures */
const createLikesInBatches = async (
  likes: LikeToCreate[],
  batchSize = 100
): Promise<number> => {
  let createdCount = 0;

  for (let i = 0; i < likes.length; i += batchSize) {
    const batch = likes.slice(i, i + batchSize);

    try {
      await prisma.like.createMany({
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

      for (const like of batch) {
        try {
          await prisma.like.create({ data: like });
          createdCount++;
        } catch (individualError) {
          logger.debug(
            { ...like, error: (individualError as Error).message },
            "Skipped individual like creation"
          );
        }
      }
    }
  }

  return createdCount;
};

/** Compute final statistics */
const computeLikeStats = (
  users: User[],
  posts: Post[],
  likes: LikeToCreate[],
  createdCount: number,
  startTime: number
): LikeStats => {
  const likeSeedingDuration = Date.now() - startTime;
  const likesByPost: Record<string, number> = {};
  const likesByUser: Record<string, number> = {};

  for (const like of likes) {
    likesByPost[like.postId] = (likesByPost[like.postId] || 0) + 1;
    likesByUser[like.userId] = (likesByUser[like.userId] || 0) + 1;
  }

  const mostLikedPost = Object.entries(likesByPost).reduce(
    (max, [postId, count]) =>
      count > max.likes ? { postId, likes: count } : max,
    { postId: null as string | null, likes: 0 }
  );

  const mostActiveUser = Object.entries(likesByUser).reduce(
    (max, [userId, count]) =>
      count > max.likes ? { userId, likes: count } : max,
    { userId: null as string | null, likes: 0 }
  );

  return {
    totalLikes: createdCount,
    avgLikesPerPost: posts.length
      ? parseFloat((createdCount / posts.length).toFixed(2))
      : 0,
    avgLikesPerUser: users.length
      ? parseFloat((createdCount / users.length).toFixed(2))
      : 0,
    mostLikedPost,
    mostActiveUser,
    likeSeedingDuration,
    distribution: {
      postsWithLikes: Object.keys(likesByPost).length,
      usersWhoLiked: Object.keys(likesByUser).length,
      totalPosts: posts.length,
      totalUsers: users.length,
    },
  };
};

/**
 * Seeds likes for posts with realistic engagement patterns.
 *
 * @param {User[]} users - Array of user objects
 * @param {Post[]} posts - Array of post objects
 * @param {LikeSeedingOptions} [options={}] - Seeding configuration options
 * @return {Promise<LikeStats>} Statistics about created likes and seeding performance
 * @throws {SeedingError} When seeding fails
 */
const seedLikes = async (
  users: User[],
  posts: Post[],
  options: LikeSeedingOptions = {}
) => {
  const seedingStartTime = Date.now();
  logger.info("Starting likes seeding process");

  try {
    const likesToCreate: LikeToCreate[] = [];

    for (const post of posts) {
      const eligibleUsers = getEligibleUsers(users, post);
      const postLikes = pickLikesForPost(post, eligibleUsers, options);
      likesToCreate.push(...postLikes);
    }

    logger.info(`Prepared ${likesToCreate.length} likes to insert`);
    const createdCount = await createLikesInBatches(likesToCreate);

    const likeStats = computeLikeStats(
      users,
      posts,
      likesToCreate,
      createdCount,
      seedingStartTime
    );
    logger.info(
      likeStats,
      `Successfully created ${likeStats.totalLikes} likes`
    );

    return likeStats;
  } catch (error) {
    return handleSeedingError(error, logger, "Like seeding", "likes", {
      usersCount: users?.length || 0,
      postsCount: posts?.length || 0,
      duration: Date.now() - seedingStartTime,
    });
  }
};

export default seedLikes;
