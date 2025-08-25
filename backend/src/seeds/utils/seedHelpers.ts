import { faker } from "@faker-js/faker";

import SeedingError from "../../core/error/custom/seed.error";

import type { Avatar, Tag } from "@prisma/client";
import type { Logger } from "pino";

/**
 * Handle and throw seeding errors with consistent formatting
 * @param {unknown} error - The caught error
 * @param {Logger} logger - Logger instance
 * @param {string} operation - Description of the failed operation
 * @param {string} phase - The seeding phase where error occurred
 * @param {Object} additionalMetadata - Additional context for the error
 * @throws {SeedingError}
 */
const handleSeedingError = (
  error: unknown,
  logger: Logger,
  operation: string,
  phase: string,
  additionalMetadata = {}
): never => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error({ error: errorMessage }, `${operation} failed`);

  throw new SeedingError(`${operation} failed: ${errorMessage}`, phase, {
    originalError: errorMessage,
    ...additionalMetadata,
  });
};

/**
 * Get random tags from an array
 * @param {Array} tags - Array of tag objects
 * @param {number} minCount - Minimum number of tags
 * @param {number} maxCount - Maximum number of tags
 * @returns {Array} Random selection of tags
 */
const getRandomTags = (tags: Tag[], minCount = 1, maxCount = 3) => {
  const shuffled = tags.sort(() => 0.5 - Math.random());
  const count = faker.number.int({ min: minCount, max: maxCount });
  return shuffled.slice(0, count);
};

/**
 * Selects and returns a random avatar from a given array.
 * This is useful for assigning a unique default avatar to a new user.
 *
 * @param {import('@prisma/client').Avatar[]} avatars An array of avatar objects to choose from.
 * @return {import('@prisma/client').Avatar} A single, randomly selected avatar object.
 */
const getRandomAvatar = (avatars: Avatar[]) => {
  return avatars[Math.floor(Math.random() * avatars.length)];
};

/**
 * Generate resource data for posts
 * @returns {Object} Resource data with file info
 */
const generateResourceData = () => {
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
};

/**
 * Calculate performance metrics
 * @param {number} startTime - Start time in milliseconds
 * @param {number} count - Number of items processed
 * @returns {Object} Performance metrics
 */
const calculateMetrics = (startTime: number, count: number) => {
  const duration = Date.now() - startTime;
  const averageTime = count > 0 ? Math.round(duration / count) : 0;

  return {
    duration,
    averageTime,
    count,
  };
};

export {
  handleSeedingError,
  calculateMetrics,
  generateResourceData,
  getRandomTags,
  getRandomAvatar,
};
