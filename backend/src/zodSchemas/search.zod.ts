import { z } from "zod";

import { uuidPaginationSchema } from "../utils/pagination.util.js";

const SearchPostsSchema = uuidPaginationSchema.extend({
  search: z.string().trim().optional(),
  tagIds: z
    .union([
      z.string(), // Handle comma-separated string from query params
      z.array(z.number()), // Handle array
    ])
    .transform((val) => {
      if (Array.isArray(val)) {
        return val;
      }

      if (!val || val.trim() === "") {
        return [];
      }

      // Split comma-separated string and convert to numbers
      return val
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id) && id > 0);
    })
    .pipe(z.array(z.number().int().positive()).max(10))
    .default([]),
});

export { SearchPostsSchema };
