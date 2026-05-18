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

class TagService {
  async validateTagExists(tagId: number): Promise<TagValidationResult> {
    const existingTag = await TagRepository.findById(tagId);

    if (!existingTag) {
      throw new TagNotFoundError(tagId);
    }

    return { tagId, existingTag };
  }

  getAllTags() {
    return TagRepository.findAll();
  }

  async getPopularTags(limit: number = 10) {
    const tags = await TagRepository.findPopular(limit);
    return TagTransformer.transformToPopularTags(tags);
  }

  async getTagForEdit(tagId: number) {
    const validation = await this.validateTagExists(tagId);
    return validation.existingTag;
  }

  createTag(data: CreateTagData) {
    const normalizedName = TagTransformer.normalizeName(data.name);
    return TagRepository.create(normalizedName);
  }

  async updateTag(tagId: number, data: UpdateTagData) {
    await this.validateTagExists(tagId);

    const normalizedName = TagTransformer.normalizeName(data.name);
    const updatedTag = await TagRepository.update(tagId, normalizedName);
    if (!updatedTag) {
      throw new TagUpdateFailedError(tagId);
    }
    return updatedTag;
  }

  async deleteTag(tagId: number) {
    await this.validateTagExists(tagId);

    await TagRepository.delete(tagId);
    return { success: true };
  }
}

const tagService = new TagService();
export { tagService, TagService };
