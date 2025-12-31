import { Prisma } from "@prisma/client";

import type {
  RawPost,
  TransformedPost,
  CreatePostInput,
} from "../../../../types/postTypes.js";
import type { PostPreview } from "../../postContentValueFormatter.js";

const PostFragments = {
  author: {
    select: {
      id: true,
      username: true,
      Avatar: {
        select: {
          id: true,
          url: true,
        },
      },
    },
  },

  postTags: {
    include: { tag: true },
  },

  counts: {
    select: { comments: true, likes: true },
  },

  commentAuthor: {
    select: {
      id: true,
      username: true,
      Avatar: { select: { id: true, url: true } },
    },
  },
} as const;

const BaseSelectors = {
  post: {
    id: true,
    title: true,
    content: true,
    type: true,
    isMock: true,
    fileUrl: true,
    fileName: true,
    createdAt: true,
    author: PostFragments.author,
    postTags: PostFragments.postTags,
    _count: PostFragments.counts,
  } satisfies Prisma.PostSelect,

  extendedPost: {
    id: true,
    title: true,
    content: true,
    type: true,
    isMock: true,
    fileUrl: true,
    fileName: true,
    fileSize: true,
    mimeType: true,
    createdAt: true,
    updatedAt: true,
    author: PostFragments.author,
    postTags: PostFragments.postTags,
    _count: PostFragments.counts,
  } satisfies Prisma.PostSelect,

  lessExtendedPost: {
    id: true,
    title: true,
    content: true,
    type: true,
    isMock: true,
    fileUrl: true,
    fileName: true,
    fileSize: true,
    createdAt: true,
    author: PostFragments.author,
    postTags: PostFragments.postTags,
    _count: PostFragments.counts,
  } satisfies Prisma.PostSelect,
} as const;

const likeWithPost = Prisma.validator<Prisma.LikeFindManyArgs>()({
  include: {
    post: {
      select: BaseSelectors.post,
    },
  },
});

type LikeWithPost = Prisma.LikeGetPayload<typeof likeWithPost>;

const bookmarkWithPost = Prisma.validator<Prisma.BookmarkFindManyArgs>()({
  include: {
    post: {
      select: BaseSelectors.post,
    },
  },
});

type BookmarkWithPost = Prisma.BookmarkGetPayload<typeof bookmarkWithPost>;

interface BookmarkAndLikeStates {
  bookmarkedPostIds: Set<string>;
  likedPostIds: Set<string>;
}

interface EnrichedPost extends TransformedPost {
  isBookmarked: boolean;
  isLiked: boolean;
}

interface EnrichedPostPreview extends PostPreview {
  isBookmarked: boolean;
  isLiked: boolean;
}

interface PaginatedPostsResponse {
  posts: (EnrichedPost | EnrichedPostPreview)[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    totalPosts?: number;
  };
}

interface UploadedFileInfo {
  publicId: string;
  secureUrl: string;
}

export type {
  LikeWithPost,
  BookmarkWithPost,
  BookmarkAndLikeStates,
  PaginatedPostsResponse,
  EnrichedPost,
  EnrichedPostPreview,
  PostPreview,
  RawPost,
  TransformedPost,
  CreatePostInput,
  UploadedFileInfo,
};
export { likeWithPost, bookmarkWithPost, BaseSelectors };
