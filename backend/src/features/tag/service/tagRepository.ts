import prisma from "../../../core/config/db.js";

import { BaseSelectors } from "./types";

/**
 * Repository layer for Tag data access
 * Handles only direct Prisma operations
 */
class TagRepository {
  /**
   * Find a tag by ID
   */
  static findById(tagId: number) {
    return prisma.tag.findUnique({
      where: { id: tagId },
      select: BaseSelectors.tag,
    });
  }

  /**
   * Check if a tag exists by ID
   */
  static async exists(tagId: number): Promise<boolean> {
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
      select: { id: true },
    });
    return !!tag;
  }

  /**
   * Find all tags
   */
  static findAll() {
    return prisma.tag.findMany({
      select: BaseSelectors.tag,
    });
  }

  /**
   * Find popular tags ordered by usage count
   */
  static findPopular(limit: number = 10) {
    return prisma.tag.findMany({
      select: BaseSelectors.tagWithCount,
      orderBy: {
        postTags: {
          _count: "desc",
        },
      },
      take: limit,
    });
  }

  /**
   * Create a new tag
   */
  static create(name: string) {
    return prisma.tag.create({
      data: { name },
      select: BaseSelectors.tag,
    });
  }

  /**
   * Update a tag
   */
  static update(tagId: number, name: string) {
    return prisma.tag.update({
      where: { id: tagId },
      data: { name },
      select: BaseSelectors.tag,
    });
  }

  /**
   * Delete a tag
   */
  static delete(tagId: number) {
    return prisma.tag.delete({
      where: { id: tagId },
    });
  }
}

export default TagRepository;
