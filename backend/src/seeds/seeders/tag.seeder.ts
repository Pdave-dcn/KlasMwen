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
      { name: "trigonometry" },
      { name: "statistics" },
      { name: "probability" },

      { name: "biology" },
      { name: "chemistry" },
      { name: "physics" },
      { name: "earth science" },

      { name: "world history" },
      { name: "haitian history" },
      { name: "economics" },
      { name: "geography" },

      { name: "haitian lit" },
      { name: "creative writing" },
      { name: "grammar" },
      { name: "french" },
      { name: "haitian creole" },

      { name: "programming" },
      { name: "coding" },

      { name: "study tips" },
      { name: "homework help" },
      { name: "note taking" },
      { name: "time management" },
      { name: "test strategies" },

      { name: "group study" },
      { name: "resources" },

      { name: "research projects" },
      { name: "presentations" },
      { name: "debates" },
    ];

    await prisma.tag.createMany({
      data: initialTags,
      skipDuplicates: true,
    });

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
