import { z } from "zod";

import { uuidPaginationSchema } from "../utils/pagination.util";

const SearchPostsSchema = uuidPaginationSchema.extend({
  search: z
    .string()
    .trim()
    .min(2, "Search term must be at least 2 characters long")
    .max(100, "Search term must be less than 100 characters")
    .refine((val) => val.length > 0, {
      message: "Search term is required",
    }),
});

export { SearchPostsSchema };
