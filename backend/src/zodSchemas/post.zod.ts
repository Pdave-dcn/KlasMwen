/**
 * Post Validation Schemas
 *
 * REQUEST: NewPostRequestSchema (client data)
 * COMPLETE: CompletePostSchema (after file processing)
 * UPDATE: UpdatedPostSchema (edit operations)
 * PARAMS: PostIdParamSchema (URL parameters)
 */

import { PostType } from "@prisma/client";
import { z } from "zod";

// Common fields for all post types
const BasePostSchema = z.object({
  title: z.string().trim().min(5).max(100),
  type: z.enum(Object.values(PostType) as [string, ...string[]]),
  tagIds: z.array(z.number().int().positive()).max(10).default([]),
});

// Text posts (QUESTION/NOTE) - includes content field
const TextPostRequestSchema = BasePostSchema.extend({
  type: z.enum(["QUESTION", "NOTE"]),
  content: z.string().trim().min(10).max(10000),
}).strict(); // Reject extra fields

// Resource posts - file data comes from multer
const ResourcePostRequestSchema = BasePostSchema.extend({
  type: z.literal("RESOURCE"),
}).strict(); // Reject extra fields like 'content'

// Resource posts after file upload processing
const CompleteResourcePostSchema = BasePostSchema.extend({
  type: z.literal("RESOURCE"),
  fileUrl: z.string(),
  fileName: z.string(),
  fileSize: z.number().positive(),
  mimeType: z.string(),
}).strict();

const NewPostRequestSchema = z.discriminatedUnion("type", [
  TextPostRequestSchema,
  ResourcePostRequestSchema,
]);

const CompletePostSchema = z.discriminatedUnion("type", [
  TextPostRequestSchema,
  CompleteResourcePostSchema,
]);

const PostIdParamSchema = z.object({
  id: z.uuid("Invalid post ID format in URL parameter."),
});

const UpdatedResourceSchema = BasePostSchema.extend({
  type: z.literal("RESOURCE"),
  fileName: z.string().trim().min(1, "Name is required for update"),
}).strict();

const UpdatedPostSchema = z.discriminatedUnion("type", [
  TextPostRequestSchema,
  UpdatedResourceSchema,
]);

export type ValidatedPostUpdateData = z.infer<typeof UpdatedPostSchema>;

export {
  NewPostRequestSchema,
  CompletePostSchema,
  PostIdParamSchema,
  UpdatedPostSchema,
};
