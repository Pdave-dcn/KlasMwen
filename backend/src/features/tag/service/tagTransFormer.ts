import type { PopularTag } from "./types.js";

/**
 * Utility functions for transforming tag data
 */
class TagTransformer {
  /**
   * Normalize tag name (lowercase, single spaces)
   */
  static normalizeName(name: string): string {
    return name.toLowerCase().replace(/\s+/g, " ").trim();
  }

  /**
   * Transform tags with count to popular tag format
   */
  static transformToPopularTags(
    tags: Array<{
      id: number;
      name: string;
      _count: { postTags: number };
    }>
  ): PopularTag[] {
    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      usageCount: tag._count.postTags,
    }));
  }
}

export default TagTransformer;
