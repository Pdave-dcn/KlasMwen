import prisma from "../../core/config/db.js";
import { createLogger } from "../../core/config/logger.js";
import { handleSeedingError } from "../utils/seedHelpers.js";

const logger = createLogger({ module: "TagSeeder" });

/**
 * Create initial tags in the database
 * @returns {Promise<Array>} Array of created tags
 */
const seedTags = async () => {
  logger.info("Tag creation phase started");
  const tagCreationStartTime = Date.now();

  try {
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
    const tags = await prisma.tag.findMany();
    const tagCreationDuration = Date.now() - tagCreationStartTime;

    const tagStats = {
      tagsToCreate: initialTags.length,
      tagsCreated: tags.length,
      tagNames: tags.map((tag) => tag.name),
      tagCreationDuration,
    };

    logger.info(tagStats, "Initial tags created successfully");

    return { tags, tagStats };
  } catch (error) {
    return handleSeedingError(error, logger, "Tag seeding", "tags");
  }
};

export default seedTags;
