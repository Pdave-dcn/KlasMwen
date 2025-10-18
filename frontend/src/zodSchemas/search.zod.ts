import { z } from "zod";

import { PaginationSchema, PostDataSchema } from "./post.zod";

const SearchDataSchema = PostDataSchema;

const SearchPaginationSchema = PaginationSchema;

const SearchMetaSchema = z.object({
  searchTerm: z.string(),
  resultsFound: z.number().int(),
  currentPageSize: z.number().int(),
});

const SearchServerResponseSchema = z.object({
  data: z.array(SearchDataSchema),
  pagination: SearchPaginationSchema,
  meta: SearchMetaSchema,
});

export { SearchServerResponseSchema };
