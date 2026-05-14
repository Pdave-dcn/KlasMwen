import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// ── hoisted mocks ─────────────────────────────────────────────────────────────

const mockClearSearch = vi.hoisted(() => vi.fn());
const mockOnCategoryChange = vi.hoisted(() => vi.fn());

const mockCategoryQuery = vi.hoisted(() => ({
  data: {
    pages: [
      { data: [{ id: "c1", name: "Circle One" }] },
      { data: [{ id: "c2", name: "Circle Two" }] },
    ],
  },
  isLoading: false,
  isError: false,
  isFetchingNextPage: false,
  hasNextPage: true,
  fetchNextPage: vi.fn(),
})) as any;

const mockSearchQueryHook = vi.hoisted(() => ({
  data: {
    pages: [{ data: [{ id: "s1", name: "Search Result One" }] }],
  },
  isLoading: false,
  isError: false,
  isFetchingNextPage: false,
  hasNextPage: false,
  fetchNextPage: vi.fn(),
})) as any;

const mockDiscoveryCategory = vi.hoisted(() => ({
  activeCategory: "popular",
  activeQuery: null as any,
  handleCategoryChange: null as any,
})) as any;

const mockCircleSearch = vi.hoisted(() => ({
  searchQuery: "",
  isSearchActive: false,
  searchQueryHook: null as any,
  suggestions: [],
  showSuggestions: false,
  isLoadingSuggestions: false,
  selectedTags: [],
  setSearchQuery: vi.fn(),
  handleSearchSubmit: vi.fn(),
  clearSearch: null as any,
  handleSearchFocus: vi.fn(),
  handleSearchBlur: vi.fn(),
  handleSuggestionSelect: vi.fn(),
  handleTagClick: vi.fn(),
})) as any;

// ── module mocks — paths must match the imports inside the hook source file ───

vi.mock(
  "@/features/study-circles/hub/hooks/useCircleDiscoveryCategory",
  () => ({
    useDiscoveryCategory: vi.fn(() => mockDiscoveryCategory),
  }),
);

vi.mock("@/features/study-circles/hub/hooks/useCircleSearch", () => ({
  useCircleSearch: vi.fn(() => mockCircleSearch),
}));

import { useCircleDiscovery } from "@/features/study-circles/hub/hooks/useCircleDiscovery";

// ── wrapper ───────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useCircleDiscovery hook", () => {
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    vi.clearAllMocks();
    wrapper = createWrapper();

    // Re-assign functions after vi.clearAllMocks() wipes them
    mockClearSearch.mockReset();
    mockOnCategoryChange.mockReset();

    // Reset category mock
    mockDiscoveryCategory.activeCategory = "popular";
    mockDiscoveryCategory.activeQuery = mockCategoryQuery;
    mockDiscoveryCategory.handleCategoryChange = mockOnCategoryChange;

    // Reset search mock
    mockCircleSearch.isSearchActive = false;
    mockCircleSearch.searchQuery = "";
    mockCircleSearch.selectedTags = [];
    mockCircleSearch.showSuggestions = false;
    mockCircleSearch.isLoadingSuggestions = false;
    mockCircleSearch.searchQueryHook = mockSearchQueryHook;
    mockCircleSearch.clearSearch = mockClearSearch;
    mockCircleSearch.setSearchQuery = vi.fn();
    mockCircleSearch.handleSearchSubmit = vi.fn();
    mockCircleSearch.handleSearchFocus = vi.fn();
    mockCircleSearch.handleSearchBlur = vi.fn();
    mockCircleSearch.handleSuggestionSelect = vi.fn();
    mockCircleSearch.handleTagClick = vi.fn();

    // Reset query data
    mockCategoryQuery.data = {
      pages: [
        { data: [{ id: "c1", name: "Circle One" }] },
        { data: [{ id: "c2", name: "Circle Two" }] },
      ],
    };
    mockCategoryQuery.isLoading = false;
    mockCategoryQuery.isError = false;
    mockCategoryQuery.hasNextPage = true;
    mockCategoryQuery.isFetchingNextPage = false;
    mockCategoryQuery.fetchNextPage = vi.fn();

    mockSearchQueryHook.data = {
      pages: [{ data: [{ id: "s1", name: "Search Result One" }] }],
    };
    mockSearchQueryHook.isLoading = false;
    mockSearchQueryHook.isError = false;
    mockSearchQueryHook.hasNextPage = false;
    mockSearchQueryHook.isFetchingNextPage = false;
    mockSearchQueryHook.fetchNextPage = vi.fn();
  });

  function render() {
    return renderHook(() => useCircleDiscovery(), { wrapper });
  }

  // ── state switching ───────────────────────────────────────────────────────

  describe("state switching", () => {
    it("uses categoryQuery data when isSearchActive is false", () => {
      mockCircleSearch.isSearchActive = false;
      const { result } = render();

      expect(result.current.data.circles).toEqual([
        { id: "c1", name: "Circle One" },
        { id: "c2", name: "Circle Two" },
      ]);
    });

    it("uses searchQueryHook data when isSearchActive is true", () => {
      mockCircleSearch.isSearchActive = true;
      const { result } = render();

      expect(result.current.data.circles).toEqual([
        { id: "s1", name: "Search Result One" },
      ]);
    });

    it("reflects categoryQuery loading state when search is inactive", () => {
      mockCircleSearch.isSearchActive = false;
      mockCategoryQuery.isLoading = true;
      const { result } = render();

      expect(result.current.data.isLoading).toBe(true);
    });

    it("reflects searchQueryHook loading state when search is active", () => {
      mockCircleSearch.isSearchActive = true;
      mockSearchQueryHook.isLoading = true;
      const { result } = render();

      expect(result.current.data.isLoading).toBe(true);
    });

    it("reflects categoryQuery error state when search is inactive", () => {
      mockCircleSearch.isSearchActive = false;
      mockCategoryQuery.isError = true;
      const { result } = render();

      expect(result.current.data.isError).toBe(true);
    });

    it("reflects searchQueryHook error state when search is active", () => {
      mockCircleSearch.isSearchActive = true;
      mockSearchQueryHook.isError = true;
      const { result } = render();

      expect(result.current.data.isError).toBe(true);
    });

    it("reflects pagination from categoryQuery when search is inactive", () => {
      mockCircleSearch.isSearchActive = false;
      mockCategoryQuery.hasNextPage = true;
      mockCategoryQuery.isFetchingNextPage = true;
      const { result } = render();

      expect(result.current.pagination.hasMore).toBe(true);
      expect(result.current.pagination.isLoadingMore).toBe(true);
    });

    it("reflects pagination from searchQueryHook when search is active", () => {
      mockCircleSearch.isSearchActive = true;
      mockSearchQueryHook.hasNextPage = true;
      mockSearchQueryHook.isFetchingNextPage = true;
      const { result } = render();

      expect(result.current.pagination.hasMore).toBe(true);
      expect(result.current.pagination.isLoadingMore).toBe(true);
    });
  });

  // ── coordination ──────────────────────────────────────────────────────────

  describe("coordination", () => {
    it("calls clearSearch when handleCategoryChange is invoked", () => {
      const { result } = render();
      act(() => result.current.category.onChange("trending"));
      expect(mockClearSearch).toHaveBeenCalledTimes(1);
    });

    it("calls onCategoryChange with the new category when handleCategoryChange is invoked", () => {
      const { result } = render();
      act(() => result.current.category.onChange("trending"));
      expect(mockOnCategoryChange).toHaveBeenCalledWith("trending");
    });

    it("calls clearSearch before onCategoryChange", () => {
      const callOrder: string[] = [];
      mockClearSearch.mockImplementation(() => callOrder.push("clearSearch"));
      mockOnCategoryChange.mockImplementation(() =>
        callOrder.push("onCategoryChange"),
      );

      const { result } = render();
      act(() => result.current.category.onChange("new"));

      expect(callOrder).toEqual(["clearSearch", "onCategoryChange"]);
    });

    it("passes correct category to onCategoryChange for each category value", () => {
      const { result } = render();

      for (const category of ["popular", "trending", "new", "small"] as const) {
        act(() => result.current.category.onChange(category));
        expect(mockOnCategoryChange).toHaveBeenLastCalledWith(category);
      }
    });

    it("exposes clearSearch as search.onClear", () => {
      const { result } = render();
      act(() => result.current.search.onClear());
      expect(mockClearSearch).toHaveBeenCalledTimes(1);
    });

    it("wires search sub-hook handlers through to the search namespace", () => {
      const { result } = render();

      expect(result.current.search.onSubmit).toBe(
        mockCircleSearch.handleSearchSubmit,
      );
      expect(result.current.search.onFocus).toBe(
        mockCircleSearch.handleSearchFocus,
      );
      expect(result.current.search.onBlur).toBe(
        mockCircleSearch.handleSearchBlur,
      );
      expect(result.current.search.onSuggestionSelect).toBe(
        mockCircleSearch.handleSuggestionSelect,
      );
      expect(result.current.search.onTagClick).toBe(
        mockCircleSearch.handleTagClick,
      );
      expect(result.current.search.setQuery).toBe(
        mockCircleSearch.setSearchQuery,
      );
    });
  });

  // ── data transformation ───────────────────────────────────────────────────

  describe("data transformation", () => {
    it("flattens multiple pages into a single circles array", () => {
      mockCircleSearch.isSearchActive = false;
      mockCategoryQuery.data = {
        pages: [
          {
            data: [
              { id: "c1", name: "Circle One" },
              { id: "c2", name: "Circle Two" },
            ],
          },
          {
            data: [
              { id: "c3", name: "Circle Three" },
              { id: "c4", name: "Circle Four" },
            ],
          },
          { data: [{ id: "c5", name: "Circle Five" }] },
        ],
      };

      const { result } = render();
      expect(result.current.data.circles).toHaveLength(5);
      expect(result.current.data.circles.map((c: any) => c.id)).toEqual([
        "c1",
        "c2",
        "c3",
        "c4",
        "c5",
      ]);
    });

    it("returns empty circles array when data is undefined", () => {
      mockCircleSearch.isSearchActive = false;
      mockCategoryQuery.data = undefined;

      const { result } = render();
      expect(result.current.data.circles).toEqual([]);
    });

    it("returns empty circles array when pages is empty", () => {
      mockCircleSearch.isSearchActive = false;
      mockCategoryQuery.data = { pages: [] };

      const { result } = render();
      expect(result.current.data.circles).toEqual([]);
    });

    it("returns single page data without duplication", () => {
      mockCircleSearch.isSearchActive = false;
      mockCategoryQuery.data = {
        pages: [{ data: [{ id: "c1", name: "Only Circle" }] }],
      };

      const { result } = render();
      expect(result.current.data.circles).toEqual([
        { id: "c1", name: "Only Circle" },
      ]);
    });

    it("flattens search result pages correctly when search is active", () => {
      mockCircleSearch.isSearchActive = true;
      mockSearchQueryHook.data = {
        pages: [
          {
            data: [
              { id: "s1", name: "Search One" },
              { id: "s2", name: "Search Two" },
            ],
          },
          { data: [{ id: "s3", name: "Search Three" }] },
        ],
      };

      const { result } = render();
      expect(result.current.data.circles).toHaveLength(3);
      expect(result.current.data.circles.map((c: any) => c.id)).toEqual([
        "s1",
        "s2",
        "s3",
      ]);
    });
  });

  // ── return shape ──────────────────────────────────────────────────────────

  describe("return shape", () => {
    it("exposes category.active from useDiscoveryCategory", () => {
      mockDiscoveryCategory.activeCategory = "trending";
      const { result } = render();
      expect(result.current.category.active).toBe("trending");
    });

    it("exposes search state fields correctly", () => {
      mockCircleSearch.searchQuery = "react";
      mockCircleSearch.selectedTags = [1, 2];
      mockCircleSearch.showSuggestions = true;
      mockCircleSearch.isLoadingSuggestions = true;

      const { result } = render();

      expect(result.current.search.query).toBe("react");
      expect(result.current.search.tags).toEqual([1, 2]);
      expect(result.current.search.suggestions.isVisible).toBe(true);
      expect(result.current.search.suggestions.isLoading).toBe(true);
    });

    it("exposes pagination.loadMore as fetchNextPage from active query", () => {
      mockCircleSearch.isSearchActive = false;
      const { result } = render();
      expect(result.current.pagination.loadMore).toBe(
        mockCategoryQuery.fetchNextPage,
      );
    });
  });
});
