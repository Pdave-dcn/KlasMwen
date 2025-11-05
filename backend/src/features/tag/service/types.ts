import type { Prisma } from "@prisma/client";

// Base selectors for different query types
const BaseSelectors = {
  tag: {
    id: true,
    name: true,
  } satisfies Prisma.TagSelect,

  tagWithCount: {
    id: true,
    name: true,
    _count: {
      select: { postTags: true },
    },
  } satisfies Prisma.TagSelect,
} as const;

// DTOs and interfaces
interface CreateTagData {
  name: string;
}

interface UpdateTagData {
  name: string;
}

interface TagValidationResult {
  tagId: number;
  existingTag: {
    id: number;
    name: string;
  };
}

// Transformed response types
interface PopularTag {
  id: number;
  name: string;
  usageCount: number;
}

export {
  BaseSelectors,
  CreateTagData,
  UpdateTagData,
  TagValidationResult,
  PopularTag,
};
