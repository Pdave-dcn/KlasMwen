import type { Post } from "@prisma/client";
import type { Request, Response } from "express";

const mockComments = [
  {
    id: 7,
    content: "Reply 3",
    author: { id: "authorC", username: "userC", Avatar: null },
    createdAt: new Date(),
    parentId: null,
    postId: "post123",
    authorId: "authorC",
    mentionedUserId: null,
  },
  {
    id: 6,
    content: "Reply 2",
    author: { id: "authorB", username: "userB", Avatar: null },
    createdAt: new Date(),
    parentId: null,
    postId: "post123",
    authorId: "authorB",
    mentionedUserId: null,
  },
  {
    id: 5,
    content: "Reply 1",
    author: { id: "authorA", username: "userA", Avatar: null },
    createdAt: new Date(),
    parentId: null,
    postId: "post123",
    authorId: "authorA",
    mentionedUserId: null,
  },
];

const mockReplies = [
  {
    id: 7,
    content: "Reply 3",
    author: { id: "authorC", username: "userC", Avatar: null },
    createdAt: new Date(),
    parentId: 1,
    postId: "post123",
    authorId: "authorC",
    mentionedUserId: null,
    hidden: false,
  },
  {
    id: 6,
    content: "Reply 2",
    author: { id: "authorB", username: "userB", Avatar: null },
    createdAt: new Date(),
    parentId: 1,
    postId: "post123",
    authorId: "authorB",
    mentionedUserId: null,
    hidden: false,
  },
  {
    id: 5,
    content: "Reply 1",
    author: { id: "authorA", username: "userA", Avatar: null },
    createdAt: new Date(),
    parentId: 1,
    postId: "post123",
    authorId: "authorA",
    mentionedUserId: null,
    hidden: false,
  },
];

const createMockPost = (overrides = {}) =>
  ({
    id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    title: "Test Post",
    authorId: "123e4567-e89b-12d3-a456-426614174000",
    content: "Some post content",
    createdAt: new Date(),
    updatedAt: new Date(),
    type: "NOTE",
    fileUrl: null,
    fileName: null,
    fileSize: null,
    mimeType: null,
    ...overrides,
  } as Post);

const createMockRequest = (overrides = {}) =>
  ({
    params: {},
    body: {},
    query: {},
    user: undefined,
    ...overrides,
  } as Request);

const createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

export {
  mockComments,
  mockReplies,
  createMockRequest,
  createMockResponse,
  createMockPost,
};
