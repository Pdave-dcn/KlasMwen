import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPopularQuery = vi.hoisted(() => ({
  data: "popular",
  status: "success",
}));
const mockTrendingQuery = vi.hoisted(() => ({
  data: "trending",
  status: "success",
}));
const mockNewQuery = vi.hoisted(() => ({ data: "new", status: "success" }));
const mockSmallQuery = vi.hoisted(() => ({ data: "small", status: "success" }));

vi.mock("@/queries/circle", () => ({
  useRecommendedCirclesQuery: vi.fn(() => mockPopularQuery),
  useTrendingCirclesQuery: vi.fn(() => mockTrendingQuery),
  useNewCirclesQuery: vi.fn(() => mockNewQuery),
  useSmallCirclesQuery: vi.fn(() => mockSmallQuery),
}));

import {
  useDiscoveryCategory,
  type DiscoveryCategory,
} from "@/features/study-circles/hub/hooks/useCircleDiscoveryCategory";
import {
  useRecommendedCirclesQuery,
  useTrendingCirclesQuery,
  useNewCirclesQuery,
  useSmallCirclesQuery,
} from "@/queries/circle";

describe("useDiscoveryCategory hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("defaults activeCategory to 'popular'", () => {
      const { result } = renderHook(() => useDiscoveryCategory());
      expect(result.current.activeCategory).toBe("popular");
    });

    it("returns the popular query as activeQuery by default", () => {
      const { result } = renderHook(() => useDiscoveryCategory());
      expect(result.current.activeQuery).toBe(mockPopularQuery);
    });

    it("calls all four queries with PAGE_LIMIT of 9 on mount", () => {
      renderHook(() => useDiscoveryCategory());
      expect(useRecommendedCirclesQuery).toHaveBeenCalledWith(9);
      expect(useTrendingCirclesQuery).toHaveBeenCalledWith(9);
      expect(useNewCirclesQuery).toHaveBeenCalledWith(9);
      expect(useSmallCirclesQuery).toHaveBeenCalledWith(9);
    });

    it("exposes handleCategoryChange as a function", () => {
      const { result } = renderHook(() => useDiscoveryCategory());
      expect(typeof result.current.handleCategoryChange).toBe("function");
    });
  });

  describe("handleCategoryChange", () => {
    it.each<DiscoveryCategory>(["popular", "trending", "new", "small"])(
      "sets activeCategory to '%s'",
      (category) => {
        const { result } = renderHook(() => useDiscoveryCategory());
        act(() => {
          result.current.handleCategoryChange(category);
        });
        expect(result.current.activeCategory).toBe(category);
      },
    );

    it("switches activeQuery to trending query when category set to 'trending'", () => {
      const { result } = renderHook(() => useDiscoveryCategory());
      act(() => result.current.handleCategoryChange("trending"));
      expect(result.current.activeQuery).toBe(mockTrendingQuery);
    });

    it("switches activeQuery to new query when category set to 'new'", () => {
      const { result } = renderHook(() => useDiscoveryCategory());
      act(() => result.current.handleCategoryChange("new"));
      expect(result.current.activeQuery).toBe(mockNewQuery);
    });

    it("switches activeQuery to small query when category set to 'small'", () => {
      const { result } = renderHook(() => useDiscoveryCategory());
      act(() => result.current.handleCategoryChange("small"));
      expect(result.current.activeQuery).toBe(mockSmallQuery);
    });

    it("switches back to popular query after being on another category", () => {
      const { result } = renderHook(() => useDiscoveryCategory());
      act(() => result.current.handleCategoryChange("trending"));
      act(() => result.current.handleCategoryChange("popular"));
      expect(result.current.activeQuery).toBe(mockPopularQuery);
      expect(result.current.activeCategory).toBe("popular");
    });

    it("handles switching through all categories in sequence", () => {
      const { result } = renderHook(() => useDiscoveryCategory());
      const sequence: DiscoveryCategory[] = [
        "trending",
        "new",
        "small",
        "popular",
      ];

      for (const category of sequence) {
        act(() => result.current.handleCategoryChange(category));
        expect(result.current.activeCategory).toBe(category);
      }
    });
  });

  describe("handleCategoryChange stability", () => {
    it("returns the same handleCategoryChange reference across rerenders", () => {
      const { result, rerender } = renderHook(() => useDiscoveryCategory());
      const firstRef = result.current.handleCategoryChange;
      rerender();
      expect(result.current.handleCategoryChange).toBe(firstRef);
    });

    it("preserves handleCategoryChange reference after a category change", () => {
      const { result } = renderHook(() => useDiscoveryCategory());
      const firstRef = result.current.handleCategoryChange;
      act(() => result.current.handleCategoryChange("trending"));
      expect(result.current.handleCategoryChange).toBe(firstRef);
    });
  });

  describe("query passthrough", () => {
    it("reflects updated query data when the active query mock changes", () => {
      const dynamicQuery = vi
        .fn()
        .mockReturnValue({ data: "popular-v1", status: "success" });
      (
        useRecommendedCirclesQuery as ReturnType<typeof vi.fn>
      ).mockImplementation(dynamicQuery);

      const { result } = renderHook(() => useDiscoveryCategory());
      expect(result.current.activeQuery.data).toBe("popular-v1");
    });

    it("all four queries are always initialised regardless of active category", () => {
      const { result } = renderHook(() => useDiscoveryCategory());
      act(() => result.current.handleCategoryChange("trending"));

      // All queries still called even when trending is active
      expect(useRecommendedCirclesQuery).toHaveBeenCalled();
      expect(useTrendingCirclesQuery).toHaveBeenCalled();
      expect(useNewCirclesQuery).toHaveBeenCalled();
      expect(useSmallCirclesQuery).toHaveBeenCalled();
    });
  });
});
