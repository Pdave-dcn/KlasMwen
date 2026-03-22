import { z } from "zod";

import type { Prisma, PrismaClient } from "@prisma/client";

type CursorType = "uuid" | "number";

/**
 * Creates a Zod schema to validate and normalize pagination parameters.
 *
 * @param {number} [defaultLimit=10] Default number of items per page.
 * @param {number} [maxLimit=50] Maximum allowed items per page.
 * @param {CursorType} [cursorType="uuid"] Type of cursor ("uuid" or "number").
 * @return {z.ZodObject<any>} Zod schema for validating `limit` and `cursor`.
 */
const createPaginationSchema = (
  defaultLimit = 10,
  maxLimit = 50,
  cursorType: CursorType = "uuid",
) => {
  const getCursorSchema = () => {
    switch (cursorType) {
      case "uuid":
        return z.uuid().optional();
      case "number":
        return z
          .string()
          .optional()
          .transform((val) => (val ? parseInt(val, 10) : undefined))
          .refine((val) => val === undefined || !isNaN(val), {
            message: "cursor must be a number",
          });
      default:
        return z.string().trim().optional();
    }
  };

  return z.object({
    limit: z
      .string()
      .trim()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : defaultLimit))
      .refine((val) => !isNaN(val), { message: "limit must be a number" })
      .refine((val) => val > 0, { message: "limit must be greater than 0" })
      .transform((val) => Math.min(val, maxLimit)),
    cursor: getCursorSchema(),
  });
};

/**
 * Prebuilt pagination schema for UUID-based cursors.
 * @type {z.ZodObject<any>}
 */
const uuidPaginationSchema = createPaginationSchema(10, 50, "uuid");

interface PaginationConfig<TOrderBy, TWhere> {
  cursor?: string | number;
  limit: number;
  cursorField?: string;
  orderBy?: Prisma.Enumerable<TOrderBy>;
  where?: TWhere;
}

/**
 * Adds cursor-based pagination to a Prisma findMany query.
 *
 * Fetches one extra item beyond the limit so we can tell if there's a next page.
 * If a cursor is provided, the query starts after that record.
 *
 * @param baseQuery - The base Prisma query to extend.
 * @param config - Pagination options: limit, cursor, cursorField, orderBy, where.
 * @returns The same query with pagination fields applied.
 */
const buildPaginatedQuery = <TModel extends keyof PrismaClient>(
  baseQuery: Prisma.Args<PrismaClient[TModel], "findMany">,
  config: PaginationConfig<
    Prisma.Args<PrismaClient[TModel], "findMany">["orderBy"],
    Prisma.Args<PrismaClient[TModel], "findMany">["where"]
  >,
): Prisma.Args<PrismaClient[TModel], "findMany"> => {
  const { cursor, limit, cursorField = "id", orderBy, where } = config;

  const query = {
    ...baseQuery,
    where: where ?? baseQuery.where ?? undefined,
    orderBy: orderBy ?? baseQuery.orderBy ?? undefined,
    take: limit + 1,
  };

  if (cursor) {
    query.cursor = { [cursorField]: cursor };
    query.skip = 1;
  }

  return query;
};

/**
 * Trims the extra item from paginated results and returns the next cursor.
 *
 * Works alongside `buildPaginatedQuery`, which fetches limit+1 items.
 * If the extra item is present, there are more pages — we strip it and
 * set the next cursor to the last visible item's cursor field.
 *
 * @param results - Raw results from Prisma (may contain the extra item).
 * @param limit - How many items were requested.
 * @param cursorField - The field to use as the cursor. Defaults to "id".
 * @returns The trimmed data and pagination info ({ hasMore, nextCursor }).
 */
const processPaginatedResults = <
  TCursorField extends string,
  TResult extends Record<TCursorField, string | number>,
>(
  results: TResult[],
  limit: number,
  cursorField: TCursorField,
) => {
  const hasMore = results.length > limit;
  const data = results.slice(0, limit);

  const nextCursor =
    hasMore && data.length > 0 ? data[data.length - 1][cursorField] : null;

  return {
    data,
    pagination: {
      hasMore,
      nextCursor,
    },
  };
};

interface CompoundCursorConfig<TOrderBy, TWhere> extends Omit<
  PaginationConfig<TOrderBy, TWhere>,
  "cursorField"
> {
  cursorFields?: Record<string, Record<string, string | number>>;
}

/**
 * Adds compound cursor pagination to a Prisma findMany query.
 *
 * Works the same as `buildPaginatedQuery` but accepts a composite cursor
 * object instead of a single field — needed when the model's primary key
 * spans multiple fields.
 *
 * @param baseQuery - The base Prisma query to extend.
 * @param config - Pagination options: limit, cursor, cursorFields, orderBy, where.
 * @returns The same query with pagination fields applied.
 */
const buildCompoundCursorQuery = <TModel extends keyof PrismaClient>(
  baseQuery: Prisma.Args<PrismaClient[TModel], "findMany">,
  config: CompoundCursorConfig<
    Prisma.Args<PrismaClient[TModel], "findMany">["orderBy"],
    Prisma.Args<PrismaClient[TModel], "findMany">["where"]
  >,
): Prisma.Args<PrismaClient[TModel], "findMany"> => {
  const { cursor, limit, cursorFields, orderBy, where } = config;

  const query = {
    ...baseQuery,
    where: where ?? baseQuery.where ?? undefined,
    orderBy: orderBy ?? baseQuery.orderBy ?? undefined,
    take: limit + 1,
  };

  if (cursor && cursorFields) {
    query.cursor = cursorFields;
    query.skip = 1;
  }

  return query;
};

export {
  uuidPaginationSchema,
  buildCompoundCursorQuery,
  buildPaginatedQuery,
  createPaginationSchema,
  processPaginatedResults,
};
