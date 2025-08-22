/* eslint-disable max-lines-per-function */
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

import prisma from "../core/config/db.js";
import { createLogger } from "../core/config/logger.js";

import type { PostType, Tag } from "@prisma/client";

const logger = createLogger({ module: "DatabaseSeeder" });

async function main() {
  logger.info("Database seeding process initiated");
  const seedingStartTime = Date.now();

  try {
    // Clear existing data
    logger.info("Database cleanup phase started");
    const cleanupStartTime = Date.now();

    logger.debug("Deleting existing post tags");
    const postTagDeleteCount = await prisma.postTag.deleteMany();

    logger.debug("Deleting existing likes");
    const likeDeleteCount = await prisma.like.deleteMany();

    logger.debug("Deleting existing comments");
    const commentDeleteCount = await prisma.comment.deleteMany();

    logger.debug("Deleting existing posts");
    const postDeleteCount = await prisma.post.deleteMany();

    logger.debug("Deleting existing users");
    const userDeleteCount = await prisma.user.deleteMany();

    logger.debug("Deleting existing tags");
    const tagDeleteCount = await prisma.tag.deleteMany();

    const cleanupDuration = Date.now() - cleanupStartTime;
    logger.info(
      {
        postTagsDeleted: postTagDeleteCount.count,
        likesDeleted: likeDeleteCount.count,
        commentsDeleted: commentDeleteCount.count,
        postsDeleted: postDeleteCount.count,
        usersDeleted: userDeleteCount.count,
        tagsDeleted: tagDeleteCount.count,
        cleanupDuration,
      },
      "Database cleanup completed successfully"
    );

    // Create Initial Tags
    logger.info("Tag creation phase started");
    const tagCreationStartTime = Date.now();

    const initialTags = [
      { name: "algebra" },
      { name: "geometry" },
      { name: "biology" },
      { name: "chemistry" },
      { name: "physics" },
      { name: "world history" },
      { name: "haiti history" },
      { name: "haitian lit" },
      { name: "writing" },
      { name: "computer science" },
      { name: "art history" },
      { name: "music theory" },
    ];

    await prisma.tag.createMany({
      data: initialTags,
      skipDuplicates: true,
    });

    // Get all created tags
    const allTags = await prisma.tag.findMany();
    const tagCreationDuration = Date.now() - tagCreationStartTime;

    logger.info(
      {
        tagsToCreate: initialTags.length,
        tagsCreated: allTags.length,
        tagNames: allTags.map((tag) => tag.name),
        tagCreationDuration,
      },
      "Initial tags created successfully"
    );

    // Generate test users
    logger.info("User creation phase started");
    const userCreationStartTime = Date.now();

    const users = [];
    const userCount = 10;

    for (let i = 0; i < userCount; i++) {
      const userStartTime = Date.now();
      const password = faker.internet.password();

      logger.debug({ userIndex: i + 1 }, "Hashing password for user");
      const hashStartTime = Date.now();
      const hashedPassword = await bcrypt.hash(password, 12);
      const hashDuration = Date.now() - hashStartTime;

      logger.debug({ userIndex: i + 1 }, "Creating user in database");
      const dbCreateStartTime = Date.now();
      const user = await prisma.user.create({
        data: {
          username: faker.internet.username(),
          email: faker.internet.email(),
          password: hashedPassword,
        },
      });
      const dbCreateDuration = Date.now() - dbCreateStartTime;

      users.push(user);
      const userTotalDuration = Date.now() - userStartTime;

      logger.info(
        {
          userIndex: i + 1,
          userId: user.id,
          username: user.username,
          email: user.email,
          plainPassword: password,
          hashDuration,
          dbCreateDuration,
          userTotalDuration,
        },
        "User created successfully"
      );
    }

    const userCreationDuration = Date.now() - userCreationStartTime;
    logger.info(
      {
        totalUsers: users.length,
        averageUserCreationTime: Math.round(
          userCreationDuration / users.length
        ),
        userCreationDuration,
      },
      "User creation phase completed"
    );

    // Helper function to get random tags
    function getRandomTags(tags: Tag[], minCount = 1, maxCount = 3) {
      const shuffled = tags.sort(() => 0.5 - Math.random());
      const count = faker.number.int({ min: minCount, max: maxCount });
      return shuffled.slice(0, count);
    }

    // Helper function to generate resource data
    function generateResourceData() {
      const fileTypes = [
        { ext: "pdf", mime: "application/pdf" },
        {
          ext: "docx",
          mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
        {
          ext: "pptx",
          mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        },
        { ext: "jpg", mime: "image/jpeg" },
        { ext: "png", mime: "image/png" },
        { ext: "zip", mime: "application/zip" },
      ];

      const randomFileType = faker.helpers.arrayElement(fileTypes);
      const fileName = `${faker.system.fileName({ extensionCount: 0 })}.${
        randomFileType.ext
      }`;

      return {
        fileUrl: faker.internet.url() + "/" + fileName,
        fileName,
        fileSize: faker.number.int({ min: 1024, max: 10485760 }), // 1KB to 10MB
        mimeType: randomFileType.mime,
      };
    }

    // Create posts for each user
    logger.info("Post creation phase started");
    const postCreationStartTime = Date.now();

    let totalPostsCreated = 0;
    const postsPerUser = 5;
    const postTypeStats = { QUESTION: 0, NOTE: 0, RESOURCE: 0 };

    for (const [userIndex, user] of users.entries()) {
      const userPostsStartTime = Date.now();
      logger.debug(
        { userId: user.id, username: user.username, userIndex: userIndex + 1 },
        "Creating posts for user"
      );

      for (let i = 0; i < postsPerUser; i++) {
        const postStartTime = Date.now();

        // Randomly select post type
        const postTypes = ["QUESTION", "NOTE", "RESOURCE"];
        const randomType = faker.helpers.arrayElement(postTypes) as PostType;
        postTypeStats[randomType]++;

        // Prepare base post data
        const postData = {
          title: faker.lorem.sentence(),
          content: faker.lorem.paragraphs(),
          authorId: user.id,
          type: randomType,
        };

        // Add resource-specific fields if post type is RESOURCE
        let resourceData = null;
        if (randomType === "RESOURCE") {
          resourceData = generateResourceData();
          Object.assign(postData, resourceData);
        }

        logger.debug({ postType: randomType }, "Creating post in database");
        const postDbStartTime = Date.now();
        const post = await prisma.post.create({
          data: postData,
        });
        const postDbDuration = Date.now() - postDbStartTime;

        // Add random tags to the post
        logger.debug({ postId: post.id }, "Adding tags to post");
        const tagAssignStartTime = Date.now();
        const randomTags = getRandomTags(allTags);
        const postTagData = randomTags.map((tag) => ({
          postId: post.id,
          tagId: tag.id,
        }));

        await prisma.postTag.createMany({
          data: postTagData,
        });
        const tagAssignDuration = Date.now() - tagAssignStartTime;

        totalPostsCreated++;
        const postTotalDuration = Date.now() - postStartTime;

        // Log post creation with tags
        const tagNames = randomTags.map((tag) => tag.name);
        logger.info(
          {
            postIndex: totalPostsCreated,
            postId: post.id,
            userId: user.id,
            postType: randomType,
            postTitle: post.title.slice(0, 50),
            titleLength: post.title.length,
            contentLength: post.content?.length,
            tagsCount: randomTags.length,
            tagNames,
            resourceData:
              randomType === "RESOURCE"
                ? {
                    fileName: resourceData?.fileName,
                    fileSize: resourceData?.fileSize,
                    mimeType: resourceData?.mimeType,
                  }
                : undefined,
            postDbDuration,
            tagAssignDuration,
            postTotalDuration,
          },
          "Post created and tagged successfully"
        );
      }

      const userPostsDuration = Date.now() - userPostsStartTime;
      logger.debug(
        {
          userId: user.id,
          username: user.username,
          postsCreated: postsPerUser,
          userPostsDuration,
        },
        "Completed post creation for user"
      );
    }

    const postCreationDuration = Date.now() - postCreationStartTime;
    const totalSeedingDuration = Date.now() - seedingStartTime;

    logger.info(
      {
        totalUsers: users.length,
        totalPosts: totalPostsCreated,
        postsPerUser,
        totalTags: allTags.length,
        postTypeDistribution: postTypeStats,
        averagePostCreationTime: Math.round(
          postCreationDuration / totalPostsCreated
        ),
        phases: {
          cleanupDuration,
          tagCreationDuration,
          userCreationDuration,
          postCreationDuration,
        },
        totalSeedingDuration,
      },
      "Database seeding completed successfully"
    );
  } catch (error) {
    const failureDuration = Date.now() - seedingStartTime;
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        errorType:
          error instanceof Error ? error.constructor.name : typeof error,
        failureDuration,
      },
      "Database seeding failed"
    );
    throw new Error("Seeding failed");
  }
}

main()
  .catch((e) => {
    logger.error(
      {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
      "Fatal error during seeding process"
    );
    throw new Error("Seeding failed");
  })
  .finally(async () => {
    logger.info("Closing database connection");
    await prisma.$disconnect();
    logger.info("Database connection closed");
  });
