/* eslint-disable max-lines-per-function */
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

import prisma from "../core/config/db";

import type { PostType, Tag } from "@prisma/client";

async function main() {
  console.log("🚀 Start seeding...");
  console.log("");

  // Clear existing data
  console.log("🧹 Clearing existing data...");
  await prisma.postTag.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tag.deleteMany();
  console.log("✅ Database cleared!");

  console.log("");

  // Create Initial Tags
  const initialTags = [
    { name: "Algebra" },
    { name: "Geometry" },
    { name: "Biology" },
    { name: "Chemistry" },
    { name: "Physics" },
    { name: "World History" },
    { name: "Haiti History" },
    { name: "Haitian Lit" },
    { name: "Writing" },
    { name: "Computer Science" },
    { name: "Art History" },
    { name: "Music Theory" },
  ];

  await prisma.tag.createMany({
    data: initialTags,
    skipDuplicates: true,
  });

  // Get all created tags
  const allTags = await prisma.tag.findMany();
  console.log("");
  console.log(`🏷️ Created ${initialTags.length} initial tags.`);
  console.log("");

  // Generate 10 test users
  const users = [];
  for (let i = 0; i < 10; i++) {
    const password = faker.internet.password();
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        username: faker.internet.username(),
        email: faker.internet.email(),
        password: hashedPassword,
      },
    });
    users.push(user);
    console.log(
      `👤 User ${i + 1} created: ${user.email} with password: ${password}`
    );
  }
  console.log("");

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

  // Create 5 posts for each user with random tags
  let totalPostsCreated = 0;
  for (const user of users) {
    for (let i = 0; i < 5; i++) {
      // Randomly select post type
      const postTypes = ["QUESTION", "NOTE", "RESOURCE"];
      const randomType = faker.helpers.arrayElement(postTypes) as PostType;

      // Prepare base post data
      const postData = {
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(),
        authorId: user.id,
        type: randomType,
      };

      // Add resource-specific fields if post type is RESOURCE
      if (randomType === "RESOURCE") {
        const resourceData = generateResourceData();
        Object.assign(postData, resourceData);
      }

      const post = await prisma.post.create({
        data: postData,
      });

      // Add random tags to the post
      const randomTags = getRandomTags(allTags);
      const postTagData = randomTags.map((tag) => ({
        postId: post.id,
        tagId: tag.id,
      }));

      await prisma.postTag.createMany({
        data: postTagData,
      });

      totalPostsCreated++;

      // Log post creation with tags
      const tagNames = randomTags.map((tag) => tag.name).join(", ");
      console.log(
        `📝 Post ${totalPostsCreated} created: "${post.title.slice(
          0,
          30
        )}..." (${randomType}) with tags: [${tagNames}]`
      );
    }
  }

  console.log("");
  console.log(
    `✅ Seeding finished successfully! Created ${totalPostsCreated} posts with random tags.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    throw new Error("❌ Seeding failed");
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
