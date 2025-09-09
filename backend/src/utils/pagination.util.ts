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
  cursorType: CursorType = "uuid"
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
 * Builds a Prisma `findMany` query with cursor-based pagination.
 *
 * @template TModel Prisma model name (e.g., "user", "post").
 * @param {Prisma.Args<PrismaClient[TModel], "findMany">} baseQuery Base Prisma query configuration.
 * @param {PaginationConfig<
 *   Prisma.Args<PrismaClient[TModel], "findMany">["orderBy"],
 *   Prisma.Args<PrismaClient[TModel], "findMany">["where"]
 * >} config Pagination options (limit, cursor, orderBy, where).
 * @return {Prisma.Args<PrismaClient[TModel], "findMany">} Modified query with pagination applied.
 */
const buildPaginatedQuery = <TModel extends keyof PrismaClient>(
  baseQuery: Prisma.Args<PrismaClient[TModel], "findMany">,
  config: PaginationConfig<
    Prisma.Args<PrismaClient[TModel], "findMany">["orderBy"],
    Prisma.Args<PrismaClient[TModel], "findMany">["where"]
  >
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
 * Processes a paginated result set and calculates pagination metadata.
 *
 * @template TResult Shape of individual items in the result set.
 * @param {TResult[]} results Array of query results (with one extra item if more exist).
 * @param {number} limit Number of items requested.
 * @param {keyof TResult} [cursorField="id"] Field used as the cursor.
 * @return {{
 *   data: TResult[],
 *   pagination: { hasMore: boolean, nextCursor: string | number | null }
 * }} Paginated data and pagination info.
 */
const processPaginatedResults = <TResult extends { id: string | number }>(
  results: TResult[],
  limit: number,
  cursorField: keyof TResult = "id"
) => {
  const hasMore = results.length > limit;
  const data = results.slice(0, limit);

  const nextCursor =
    hasMore && data.length > 0
      ? data[data.length - 1][cursorField] ?? data[data.length - 1].id
      : null;

  return {
    data,
    pagination: {
      hasMore,
      nextCursor,
    },
  };
};

interface CompoundCursorConfig<TOrderBy, TWhere>
  extends Omit<PaginationConfig<TOrderBy, TWhere>, "cursorField"> {
  cursorFields: Record<string, Record<string, string | number>>;
}

/**
 * Builds a Prisma `findMany` query with **compound cursor** pagination.
 *
 * @template TModel Prisma model name (e.g., "bookmark").
 * @param {Prisma.Args<PrismaClient[TModel], "findMany">} baseQuery Base Prisma query configuration.
 * @param {CompoundCursorConfig<
 *   Prisma.Args<PrismaClient[TModel], "findMany">["orderBy"],
 *   Prisma.Args<PrismaClient[TModel], "findMany">["where"]
 * >} config Pagination options with compound cursor fields.
 * @return {Prisma.Args<PrismaClient[TModel], "findMany">} Modified query with compound cursor pagination.
 */
const buildCompoundCursorQuery = <TModel extends keyof PrismaClient>(
  baseQuery: Prisma.Args<PrismaClient[TModel], "findMany">,
  config: CompoundCursorConfig<
    Prisma.Args<PrismaClient[TModel], "findMany">["orderBy"],
    Prisma.Args<PrismaClient[TModel], "findMany">["where"]
  >
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
