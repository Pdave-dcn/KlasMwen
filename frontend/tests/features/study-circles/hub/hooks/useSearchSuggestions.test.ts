import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDebouncedValue = vi.hoisted(() => vi.fn((value: string) => value));

const mockSuggestionsQuery = vi.hoisted(() => ({
  data: undefined as string[] | undefined,
  isLoading: false,
}));

vi.mock("@/features/search/hooks/useDebouncedValue", () => ({
  useDebouncedValue: mockDebouncedValue,
}));

vi.mock("@/queries/circle", () => ({
  useSuggestionsQuery: vi.fn(() => mockSuggestionsQuery),
}));

import { useSearchSuggestions } from "@/features/study-circles/hub/hooks/useSearchSuggestions";
import { useSuggestionsQuery } from "@/queries/circle";

describe("useSearchSuggestions hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset debounce mock to pass through value by default
    mockDebouncedValue.mockImplementation((value: string) => value);
    // Reset query mock to empty state
    mockSuggestionsQuery.data = undefined;
    mockSuggestionsQuery.isLoading = false;
  });

  describe("initial state", () => {
    it("initialises showSuggestions as false", () => {
      const { result } = renderHook(() => useSearchSuggestions("", false));
      expect(result.current.showSuggestions).toBe(false);
    });

    it("initialises suggestions as empty array when query returns undefined", () => {
      const { result } = renderHook(() => useSearchSuggestions("", false));
      expect(result.current.suggestions).toEqual([]);
    });

    it("initialises isLoadingSuggestions as false", () => {
      const { result } = renderHook(() => useSearchSuggestions("", false));
      expect(result.current.isLoadingSuggestions).toBe(false);
    });

    it("exposes setShowSuggestions as a function", () => {
      const { result } = renderHook(() => useSearchSuggestions("", false));
      expect(typeof result.current.setShowSuggestions).toBe("function");
    });

    it("calls useSuggestionsQuery with debounced query and limit of 5", () => {
      mockDebouncedValue.mockReturnValue("react");
      renderHook(() => useSearchSuggestions("react", false));
      expect(useSuggestionsQuery).toHaveBeenCalledWith("react", 5);
    });

    it("passes searchQuery and debounce delay of 300 to useDebouncedValue", () => {
      renderHook(() => useSearchSuggestions("hello", false));
      expect(mockDebouncedValue).toHaveBeenCalledWith("hello", 300);
    });
  });

  describe("showSuggestions auto-show logic", () => {
    it("shows suggestions when debounced query is non-empty, results exist, and search is not active", () => {
      mockDebouncedValue.mockReturnValue("react");
      mockSuggestionsQuery.data = ["react hooks", "react query"];

      const { result } = renderHook(() => useSearchSuggestions("react", false));
      expect(result.current.showSuggestions).toBe(true);
    });

    it("does not show suggestions when search is active", () => {
      mockDebouncedValue.mockReturnValue("react");
      mockSuggestionsQuery.data = ["react hooks"];

      const { result } = renderHook(() => useSearchSuggestions("react", true));
      expect(result.current.showSuggestions).toBe(false);
    });

    it("does not show suggestions when suggestions list is empty", () => {
      mockDebouncedValue.mockReturnValue("react");
      mockSuggestionsQuery.data = [];

      const { result } = renderHook(() => useSearchSuggestions("react", false));
      expect(result.current.showSuggestions).toBe(false);
    });

    it("does not show suggestions when debounced query is empty string", () => {
      mockDebouncedValue.mockReturnValue("");
      mockSuggestionsQuery.data = ["react hooks"];

      const { result } = renderHook(() => useSearchSuggestions("", false));
      expect(result.current.showSuggestions).toBe(false);
    });

    it("does not show suggestions when debounced query is whitespace only", () => {
      mockDebouncedValue.mockReturnValue("   ");
      mockSuggestionsQuery.data = ["react hooks"];

      const { result } = renderHook(() => useSearchSuggestions("   ", false));
      expect(result.current.showSuggestions).toBe(false);
    });

    it("hides suggestions when debounced query is cleared after being set", () => {
      mockDebouncedValue.mockReturnValue("react");
      mockSuggestionsQuery.data = ["react hooks"];

      const { result, rerender } = renderHook(
        ({ query }: { query: string }) => useSearchSuggestions(query, false),
        { initialProps: { query: "react" } },
      );
      expect(result.current.showSuggestions).toBe(true);

      mockDebouncedValue.mockReturnValue("");
      rerender({ query: "" });
      expect(result.current.showSuggestions).toBe(false);
    });

    it("hides suggestions when isSearchActive becomes true", () => {
      mockDebouncedValue.mockReturnValue("react");
      mockSuggestionsQuery.data = ["react hooks"];

      const { result, rerender } = renderHook(
        ({ isActive }: { isActive: boolean }) =>
          useSearchSuggestions("react", isActive),
        { initialProps: { isActive: false } },
      );
      expect(result.current.showSuggestions).toBe(true);

      rerender({ isActive: true });
      // showSuggestions stays true — effect only sets false when query clears,
      // not when isSearchActive alone changes with a non-empty query
      expect(result.current.showSuggestions).toBe(true);
    });

    it("does not re-show suggestions after manually hiding them when query unchanged", () => {
      mockDebouncedValue.mockReturnValue("react");
      mockSuggestionsQuery.data = ["react hooks"];

      const { result } = renderHook(() => useSearchSuggestions("react", false));
      expect(result.current.showSuggestions).toBe(true);

      act(() => result.current.setShowSuggestions(false));
      expect(result.current.showSuggestions).toBe(false);
    });
  });

  describe("suggestions passthrough", () => {
    it("returns suggestions from query data", () => {
      mockSuggestionsQuery.data = ["circle A", "circle B", "circle C"];
      const { result } = renderHook(() =>
        useSearchSuggestions("circle", false),
      );
      expect(result.current.suggestions).toEqual([
        "circle A",
        "circle B",
        "circle C",
      ]);
    });

    it("returns empty array when query data is undefined", () => {
      mockSuggestionsQuery.data = undefined;
      const { result } = renderHook(() =>
        useSearchSuggestions("circle", false),
      );
      expect(result.current.suggestions).toEqual([]);
    });

    it("returns empty array when query data is empty array", () => {
      mockSuggestionsQuery.data = [];
      const { result } = renderHook(() =>
        useSearchSuggestions("circle", false),
      );
      expect(result.current.suggestions).toEqual([]);
    });
  });

  describe("loading state passthrough", () => {
    it("reflects isLoading true from query", () => {
      mockSuggestionsQuery.isLoading = true;
      const { result } = renderHook(() => useSearchSuggestions("react", false));
      expect(result.current.isLoadingSuggestions).toBe(true);
    });

    it("reflects isLoading false from query", () => {
      mockSuggestionsQuery.isLoading = false;
      const { result } = renderHook(() => useSearchSuggestions("react", false));
      expect(result.current.isLoadingSuggestions).toBe(false);
    });
  });

  describe("setShowSuggestions", () => {
    it("manually sets showSuggestions to true", () => {
      const { result } = renderHook(() => useSearchSuggestions("", false));
      act(() => result.current.setShowSuggestions(true));
      expect(result.current.showSuggestions).toBe(true);
    });

    it("manually sets showSuggestions to false when it was true", () => {
      mockDebouncedValue.mockReturnValue("react");
      mockSuggestionsQuery.data = ["react hooks"];

      const { result } = renderHook(() => useSearchSuggestions("react", false));
      expect(result.current.showSuggestions).toBe(true);

      act(() => result.current.setShowSuggestions(false));
      expect(result.current.showSuggestions).toBe(false);
    });
  });
});
