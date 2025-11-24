import {
  TagNotFoundError,
  TagUpdateFailedError,
} from "../../../core/error/custom/tag.error.js";

import TagRepository from "./tagRepository.js";
import TagTransformer from "./tagTransFormer.js";

import type {
  CreateTagData,
  UpdateTagData,
  TagValidationResult,
} from "./types.js";

/**
 * Service layer for Tag business logic
 * Orchestrates repository calls and applies business rules
 */
class TagService {
  /**
   * Validate tag existence
   * Returns tag data if exists, sends error response if not
   */
  static async validateTagExists(
    tagId: number
  ): Promise<TagValidationResult | null> {
    const existingTag = await TagRepository.findById(tagId);

    if (!existingTag) {
      throw new TagNotFoundError(tagId);
    }

    return { tagId, existingTag };
  }

  /**
   * Get all tags
   */
  static getAllTags() {
    return TagRepository.findAll();
  }

  /**
   * Get popular tags with usage count
   */
  static async getPopularTags(limit: number = 10) {
    const tags = await TagRepository.findPopular(limit);
    return TagTransformer.transformToPopularTags(tags);
  }

  /**
   * Get a tag by ID for editing
   */
  static async getTagForEdit(tagId: number) {
    const validation = await this.validateTagExists(tagId);
    if (!validation) return;

    return validation.existingTag;
  }

  /**
   * Create a new tag with normalized name
   */
  static createTag(data: CreateTagData) {
    const normalizedName = TagTransformer.normalizeName(data.name);
    return TagRepository.create(normalizedName);
  }

  /**
   * Update a tag with normalized name
   */
  static async updateTag(tagId: number, data: UpdateTagData) {
    const validation = await this.validateTagExists(tagId);
    if (!validation) return;

    const normalizedName = TagTransformer.normalizeName(data.name);
    const updatedTag = await TagRepository.update(tagId, normalizedName);
    if (!updatedTag) {
      throw new TagUpdateFailedError(tagId);
    }
    return updatedTag;
  }

  /**
   * Delete a tag
   */
  static async deleteTag(tagId: number) {
    const validation = await this.validateTagExists(tagId);
    if (!validation) return;

    await TagRepository.delete(tagId);
    return { success: true };
  }
}

export default TagService;
