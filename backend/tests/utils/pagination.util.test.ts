import { describe, it, expect } from "vitest";
import {
  buildPaginatedQuery,
  buildCompoundCursorQuery,
  processPaginatedResults,
  createPaginationSchema,
} from "../../src/utils/pagination.util.js";

describe("pagination.util", () => {
  // ─── createPaginationSchema ───────────────────────────────────────────────

  describe("createPaginationSchema", () => {
    it("should use default limit when none is provided", () => {
      const schema = createPaginationSchema(10, 50, "uuid");
      const result = schema.parse({});
      expect(result.limit).toBe(10);
    });

    it("should parse a valid limit string", () => {
      const schema = createPaginationSchema(10, 50, "uuid");
      const result = schema.parse({ limit: "5" });
      expect(result.limit).toBe(5);
    });

    it("should cap limit at maxLimit", () => {
      const schema = createPaginationSchema(10, 50, "uuid");
      const result = schema.parse({ limit: "999" });
      expect(result.limit).toBe(50);
    });

    it("should reject a non-numeric limit", () => {
      const schema = createPaginationSchema(10, 50, "uuid");
      expect(() => schema.parse({ limit: "abc" })).toThrow();
    });

    it("should reject a limit of zero", () => {
      const schema = createPaginationSchema(10, 50, "uuid");
      expect(() => schema.parse({ limit: "0" })).toThrow();
    });

    it("should parse a valid uuid cursor", () => {
      const schema = createPaginationSchema(10, 50, "uuid");
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      const result = schema.parse({ cursor: uuid });
      expect(result.cursor).toBe(uuid);
    });

    it("should reject an invalid uuid cursor", () => {
      const schema = createPaginationSchema(10, 50, "uuid");
      expect(() => schema.parse({ cursor: "not-a-uuid" })).toThrow();
    });

    it("should parse a valid number cursor", () => {
      const schema = createPaginationSchema(10, 50, "number");
      const result = schema.parse({ cursor: "42" });
      expect(result.cursor).toBe(42);
    });

    it("should reject a non-numeric number cursor", () => {
      const schema = createPaginationSchema(10, 50, "number");
      expect(() => schema.parse({ cursor: "abc" })).toThrow();
    });

    it("should return undefined cursor when none is provided", () => {
      const schema = createPaginationSchema(10, 50, "uuid");
      const result = schema.parse({});
      expect(result.cursor).toBeUndefined();
    });
  });

  // ─── buildPaginatedQuery ──────────────────────────────────────────────────

  describe("buildPaginatedQuery", () => {
    const baseQuery = {
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    } as any;

    it("should set take to limit + 1", () => {
      const result = buildPaginatedQuery(baseQuery, {
        limit: 10,
        cursorField: "id",
      });
      expect(result.take).toBe(11);
    });

    it("should preserve the base query fields", () => {
      const result = buildPaginatedQuery(baseQuery, {
        limit: 10,
        cursorField: "id",
      });
      expect(result.where).toEqual({ isActive: true });
      expect(result.orderBy).toEqual({ createdAt: "desc" });
    });

    it("should not set cursor or skip when no cursor is provided", () => {
      const result = buildPaginatedQuery(baseQuery, {
        limit: 10,
        cursorField: "id",
      });
      expect(result.cursor).toBeUndefined();
      expect(result.skip).toBeUndefined();
    });

    it("should set cursor and skip when cursor is provided", () => {
      const result = buildPaginatedQuery(baseQuery, {
        limit: 10,
        cursor: "some-uuid",
        cursorField: "id",
      });
      expect(result.cursor).toEqual({ id: "some-uuid" });
      expect(result.skip).toBe(1);
    });

    it("should override where and orderBy when provided in config", () => {
      const result = buildPaginatedQuery(baseQuery, {
        limit: 10,
        cursorField: "id",
        where: { isActive: false },
        orderBy: { createdAt: "asc" },
      });
      expect(result.where).toEqual({ isActive: false });
      expect(result.orderBy).toEqual({ createdAt: "asc" });
    });
  });

  // ─── buildCompoundCursorQuery ─────────────────────────────────────────────

  describe("buildCompoundCursorQuery", () => {
    const baseQuery = {
      where: { circleId: "circle-1" },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    } as any;

    it("should set take to limit + 1", () => {
      const result = buildCompoundCursorQuery(baseQuery, { limit: 10 });
      expect(result.take).toBe(11);
    });

    it("should not set cursor or skip when no cursor or cursorFields are provided", () => {
      const result = buildCompoundCursorQuery(baseQuery, { limit: 10 });
      expect(result.cursor).toBeUndefined();
      expect(result.skip).toBeUndefined();
    });

    it("should set compound cursor and skip when both cursor and cursorFields are provided", () => {
      const cursorFields = {
        userId_circleId: { userId: "user-1", circleId: "circle-1" },
      };
      const result = buildCompoundCursorQuery(baseQuery, {
        limit: 10,
        cursor: "user-1",
        cursorFields,
      });
      expect(result.cursor).toEqual(cursorFields);
      expect(result.skip).toBe(1);
    });

    it("should not set cursor when cursor is missing even if cursorFields is provided", () => {
      const result = buildCompoundCursorQuery(baseQuery, {
        limit: 10,
        cursorFields: {
          userId_circleId: { userId: "user-1", circleId: "circle-1" },
        },
      });
      expect(result.cursor).toBeUndefined();
      expect(result.skip).toBeUndefined();
    });
  });

  // ─── processPaginatedResults ──────────────────────────────────────────────

  describe("processPaginatedResults", () => {
    const makeItems = (count: number) =>
      Array.from({ length: count }, (_, i) => ({ id: `item-${i + 1}` }));

    it("should return all items and hasMore=false when results are within limit", () => {
      const items = makeItems(3);
      const result = processPaginatedResults(items, 5, "id");
      expect(result.data).toHaveLength(3);
      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.nextCursor).toBeNull();
    });

    it("should trim the extra item and set hasMore=true when results exceed limit", () => {
      const items = makeItems(6); // limit+1
      const result = processPaginatedResults(items, 5, "id");
      expect(result.data).toHaveLength(5);
      expect(result.pagination.hasMore).toBe(true);
    });

    it("should set nextCursor to the last visible item's cursor field", () => {
      const items = makeItems(6);
      const result = processPaginatedResults(items, 5, "id");
      expect(result.pagination.nextCursor).toBe("item-5");
    });

    it("should return nextCursor=null when there are no more pages", () => {
      const items = makeItems(3);
      const result = processPaginatedResults(items, 5, "id");
      expect(result.pagination.nextCursor).toBeNull();
    });

    it("should return empty data with hasMore=false for an empty result set", () => {
      const result = processPaginatedResults([], 5, "id");
      expect(result.data).toHaveLength(0);
      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.nextCursor).toBeNull();
    });

    it("should use a custom cursor field", () => {
      const items = [
        { userId: "user-1" },
        { userId: "user-2" },
        { userId: "user-3" },
      ];
      const result = processPaginatedResults(items, 2, "userId");
      expect(result.pagination.nextCursor).toBe("user-2");
    });
  });
});
