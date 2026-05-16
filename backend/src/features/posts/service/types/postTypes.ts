import { Prisma } from "@prisma/client";

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

type ExtendedPost = Prisma.PostGetPayload<{
  select: typeof BaseSelectors.extendedPost;
}>;

type BasePost = Prisma.PostGetPayload<{
  select: typeof BaseSelectors.post;
}>;

type TransformedPost = Omit<ExtendedPost, "postTags"> & {
  tags: { id: number; name: string }[];
};

interface ResourcePost extends TransformedPost {
  type: "RESOURCE";
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

interface TextPost extends TransformedPost {
  type: "QUESTION" | "NOTE";
  content: string;
}

type PostPreview = Omit<
  TransformedPost,
  "updatedAt" | "mimeType" | "fileSize" | "comments"
>;

type EditResponse = {
  id: string;
  title: string;
  tags: TransformedPost["tags"];
  hasFile: boolean;
} & (
  | {
      hasFile: true;
      fileName: string;
      fileSize: number;
    }
  | {
      hasFile: false;
      content: string;
    }
);

interface BasePostInput {
  title: string;
  tagIds: number[];
}

interface TextPostInput extends BasePostInput {
  type: "QUESTION" | "NOTE";
  content: string;
}

interface ResourcePostInput extends BasePostInput {
  type: "RESOURCE";
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

type CreatePostInput = TextPostInput | ResourcePostInput;

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
  EditResponse,
  TextPost,
  ResourcePost,
  TransformedPost,
  CreatePostInput,
  TextPostInput,
  ResourcePostInput,
  UploadedFileInfo,
  ExtendedPost,
  BasePost,
};
export { likeWithPost, bookmarkWithPost, BaseSelectors };
