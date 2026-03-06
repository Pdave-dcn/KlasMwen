import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── hoisted mocks ────────────────────────────────────────────────────────────

const mockDebouncedValue = vi.hoisted(() => vi.fn((value: string) => value));

const mockSearchQueryHook = vi.hoisted(() => ({
  data: undefined,
  isLoading: false,
  isError: false,
}));

const mockSuggestionsState = vi.hoisted(() => ({
  suggestions: [] as string[],
  showSuggestions: false,
  isLoadingSuggestions: false,
  setShowSuggestions: vi.fn(),
}));

vi.mock("@/features/search/hooks/useDebouncedValue", () => ({
  useDebouncedValue: mockDebouncedValue,
}));

vi.mock("@/queries/circle", () => ({
  useSearchCirclesQuery: vi.fn(() => mockSearchQueryHook),
}));

vi.mock("@/features/study-circles/hub/hooks/useSearchSuggestions", () => ({
  useSearchSuggestions: vi.fn(() => mockSuggestionsState),
}));

import { useCircleSearch } from "@/features/study-circles/hub/hooks/useCircleSearch";
import { useSearchCirclesQuery } from "@/queries/circle";
import { useSearchSuggestions } from "@/features/study-circles/hub/hooks/useSearchSuggestions";

// ── helpers ──────────────────────────────────────────────────────────────────

const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

describe("useCircleSearch hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDebouncedValue.mockImplementation((value: string) => value);
    mockSuggestionsState.suggestions = [];
    mockSuggestionsState.showSuggestions = false;
    mockSuggestionsState.isLoadingSuggestions = false;
    mockSuggestionsState.setShowSuggestions = vi.fn();
  });

  // ── initial state ──────────────────────────────────────────────────────────

  describe("initial state", () => {
    it("initialises searchQuery as empty string", () => {
      const { result } = renderHook(() => useCircleSearch());
      expect(result.current.searchQuery).toBe("");
    });

    it("initialises selectedTags as empty array", () => {
      const { result } = renderHook(() => useCircleSearch());
      expect(result.current.selectedTags).toEqual([]);
    });

    it("initialises isSearchActive as false", () => {
      const { result } = renderHook(() => useCircleSearch());
      expect(result.current.isSearchActive).toBe(false);
    });

    it("initialises showSuggestions as false", () => {
      const { result } = renderHook(() => useCircleSearch());
      expect(result.current.showSuggestions).toBe(false);
    });

    it("calls useDebouncedValue with searchQuery and 300ms delay", () => {
      renderHook(() => useCircleSearch());
      expect(mockDebouncedValue).toHaveBeenCalledWith("", 300);
    });

    it("calls useSearchCirclesQuery with shouldEnableSearch false initially", () => {
      renderHook(() => useCircleSearch());
      expect(useSearchCirclesQuery).toHaveBeenCalledWith(
        { query: undefined, tagIds: undefined },
        9,
        false,
      );
    });

    it("calls useSearchSuggestions with empty query and isSearchActive false", () => {
      renderHook(() => useCircleSearch());
      expect(useSearchSuggestions).toHaveBeenCalledWith("", false);
    });

    it("exposes all expected return values", () => {
      const { result } = renderHook(() => useCircleSearch());
      expect(result.current).toMatchObject({
        searchQuery: expect.any(String),
        selectedTags: expect.any(Array),
        isSearchActive: expect.any(Boolean),
        searchQueryHook: expect.any(Object),
        suggestions: expect.any(Array),
        showSuggestions: expect.any(Boolean),
        isLoadingSuggestions: expect.any(Boolean),
        setSearchQuery: expect.any(Function),
        executeSearch: expect.any(Function),
        handleSearchSubmit: expect.any(Function),
        clearSearch: expect.any(Function),
        handleSearchFocus: expect.any(Function),
        handleSearchBlur: expect.any(Function),
        handleSuggestionSelect: expect.any(Function),
        handleTagClick: expect.any(Function),
        setSelectedTags: expect.any(Function),
      });
    });
  });

  // ── shouldEnableSearch ─────────────────────────────────────────────────────

  describe("shouldEnableSearch flag", () => {
    it("is false when isSearchActive is false even with a query", () => {
      mockDebouncedValue.mockReturnValue("react");
      renderHook(() => useCircleSearch());
      expect(useSearchCirclesQuery).toHaveBeenCalledWith(
        expect.anything(),
        9,
        false,
      );
    });

    it("is true when isSearchActive is true and debounced query is non-empty", () => {
      mockDebouncedValue.mockReturnValue("react");
      const { result } = renderHook(() => useCircleSearch());

      act(() => result.current.setSearchQuery("react"));
      act(() => result.current.executeSearch());

      expect(useSearchCirclesQuery).toHaveBeenLastCalledWith(
        { query: "react", tagIds: undefined },
        9,
        true,
      );
    });

    it("is true when isSearchActive is true and tags are selected", () => {
      const { result } = renderHook(() => useCircleSearch());

      act(() => result.current.handleTagClick({ id: 1, name: "tag" } as any));

      expect(useSearchCirclesQuery).toHaveBeenLastCalledWith(
        { query: undefined, tagIds: [1] },
        9,
        true,
      );
    });

    it("passes tagIds as undefined when selectedTags is empty", () => {
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.executeSearch());
      expect(useSearchCirclesQuery).toHaveBeenLastCalledWith(
        { query: undefined, tagIds: undefined },
        9,
        false,
      );
    });

    it("passes query as undefined when debouncedQuery is empty", () => {
      mockDebouncedValue.mockReturnValue("");
      renderHook(() => useCircleSearch());
      expect(useSearchCirclesQuery).toHaveBeenCalledWith(
        { query: undefined, tagIds: undefined },
        9,
        false,
      );
    });
  });

  // ── executeSearch ──────────────────────────────────────────────────────────

  describe("executeSearch", () => {
    it("sets isSearchActive to true when query is non-empty", () => {
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.setSearchQuery("react"));
      act(() => result.current.executeSearch());
      expect(result.current.isSearchActive).toBe(true);
    });

    it("calls setShowSuggestions(false) on execute", () => {
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.setSearchQuery("react"));
      act(() => result.current.executeSearch());
      expect(mockSuggestionsState.setShowSuggestions).toHaveBeenCalledWith(
        false,
      );
    });

    it("does nothing when query is empty and no tags selected", () => {
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.executeSearch());
      expect(result.current.isSearchActive).toBe(false);
      expect(mockSuggestionsState.setShowSuggestions).not.toHaveBeenCalled();
    });

    it("does nothing when query is whitespace only and no tags selected", () => {
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.setSearchQuery("   "));
      act(() => result.current.executeSearch());
      expect(result.current.isSearchActive).toBe(false);
    });

    it("executes when query is empty but tags are selected", () => {
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.setSelectedTags([1, 2]));
      act(() => result.current.executeSearch());
      expect(result.current.isSearchActive).toBe(true);
    });
  });

  // ── handleSearchSubmit ─────────────────────────────────────────────────────

  describe("handleSearchSubmit", () => {
    it("calls preventDefault on the event", () => {
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.setSearchQuery("react"));
      act(() => result.current.handleSearchSubmit(fakeEvent));
      expect(fakeEvent.preventDefault).toHaveBeenCalled();
    });

    it("executes search on submit with valid query", () => {
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.setSearchQuery("react"));
      act(() => result.current.handleSearchSubmit(fakeEvent));
      expect(result.current.isSearchActive).toBe(true);
    });

    it("does not activate search when query is empty on submit", () => {
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.handleSearchSubmit(fakeEvent));
      expect(result.current.isSearchActive).toBe(false);
    });
  });

  // ── clearSearch ────────────────────────────────────────────────────────────

  describe("clearSearch", () => {
    it("resets searchQuery to empty string", () => {
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.setSearchQuery("react"));
      act(() => result.current.clearSearch());
      expect(result.current.searchQuery).toBe("");
    });

    it("resets isSearchActive to false", () => {
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.setSearchQuery("react"));
      act(() => result.current.executeSearch());
      act(() => result.current.clearSearch());
      expect(result.current.isSearchActive).toBe(false);
    });

    it("resets selectedTags to empty array", () => {
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.setSelectedTags([1, 2]));
      act(() => result.current.clearSearch());
      expect(result.current.selectedTags).toEqual([]);
    });

    it("calls setShowSuggestions(false)", () => {
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.clearSearch());
      expect(mockSuggestionsState.setShowSuggestions).toHaveBeenCalledWith(
        false,
      );
    });
  });

  // ── handleSearchFocus ──────────────────────────────────────────────────────

  describe("handleSearchFocus", () => {
    it("calls setShowSuggestions(true) when suggestions exist and query is non-empty", () => {
      mockSuggestionsState.suggestions = ["circle A"];
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.setSearchQuery("circle"));
      act(() => result.current.handleSearchFocus());
      expect(mockSuggestionsState.setShowSuggestions).toHaveBeenCalledWith(
        true,
      );
    });

    it("does not call setShowSuggestions when suggestions are empty", () => {
      mockSuggestionsState.suggestions = [];
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.setSearchQuery("circle"));
      act(() => result.current.handleSearchFocus());
      expect(mockSuggestionsState.setShowSuggestions).not.toHaveBeenCalled();
    });

    it("does not call setShowSuggestions when searchQuery is empty", () => {
      mockSuggestionsState.suggestions = ["circle A"];
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.handleSearchFocus());
      expect(mockSuggestionsState.setShowSuggestions).not.toHaveBeenCalled();
    });

    it("does not call setShowSuggestions when searchQuery is whitespace only", () => {
      mockSuggestionsState.suggestions = ["circle A"];
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.setSearchQuery("   "));
      act(() => result.current.handleSearchFocus());
      expect(mockSuggestionsState.setShowSuggestions).not.toHaveBeenCalled();
    });
  });

  // ── handleSearchBlur ───────────────────────────────────────────────────────

  describe("handleSearchBlur", () => {
    it("calls setShowSuggestions(false) after 200ms delay", async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.handleSearchBlur());
      expect(mockSuggestionsState.setShowSuggestions).not.toHaveBeenCalled();
      await act(async () => vi.advanceTimersByTime(200));
      expect(mockSuggestionsState.setShowSuggestions).toHaveBeenCalledWith(
        false,
      );
      vi.useRealTimers();
    });

    it("does not call setShowSuggestions before 200ms elapses", () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.handleSearchBlur());
      vi.advanceTimersByTime(199);
      expect(mockSuggestionsState.setShowSuggestions).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  // ── handleSuggestionSelect ─────────────────────────────────────────────────

  describe("handleSuggestionSelect", () => {
    const suggestion = { name: "React Developers", id: "s1" } as any;

    it("sets searchQuery to suggestion name", () => {
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.handleSuggestionSelect(suggestion));
      expect(result.current.searchQuery).toBe("React Developers");
    });

    it("sets isSearchActive to true", () => {
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.handleSuggestionSelect(suggestion));
      expect(result.current.isSearchActive).toBe(true);
    });

    it("calls setShowSuggestions(false)", () => {
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.handleSuggestionSelect(suggestion));
      expect(mockSuggestionsState.setShowSuggestions).toHaveBeenCalledWith(
        false,
      );
    });
  });

  // ── handleTagClick ─────────────────────────────────────────────────────────

  describe("handleTagClick", () => {
    const tag = { id: 42, name: "TypeScript" } as any;

    it("adds tag id to selectedTags when not already selected", () => {
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.handleTagClick(tag));
      expect(result.current.selectedTags).toContain(42);
    });

    it("removes tag id from selectedTags when already selected", () => {
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.handleTagClick(tag));
      act(() => result.current.handleTagClick(tag));
      expect(result.current.selectedTags).not.toContain(42);
    });

    it("sets isSearchActive to true when not already active", () => {
      const { result } = renderHook(() => useCircleSearch());
      expect(result.current.isSearchActive).toBe(false);
      act(() => result.current.handleTagClick(tag));
      expect(result.current.isSearchActive).toBe(true);
    });

    it("keeps isSearchActive true when already active", () => {
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.setSearchQuery("react"));
      act(() => result.current.executeSearch());
      act(() => result.current.handleTagClick(tag));
      expect(result.current.isSearchActive).toBe(true);
    });

    it("handles multiple different tags being toggled", () => {
      const tag2 = { id: 99, name: "React" } as any;
      const { result } = renderHook(() => useCircleSearch());
      act(() => result.current.handleTagClick(tag));
      act(() => result.current.handleTagClick(tag2));
      expect(result.current.selectedTags).toEqual([42, 99]);
    });
  });

  // ── callback stability ─────────────────────────────────────────────────────

  describe("callback reference stability", () => {
    it.each(["clearSearch", "handleSearchBlur"] as const)(
      "%s is stable across rerenders",
      (fn) => {
        const { result, rerender } = renderHook(() => useCircleSearch());
        const ref = result.current[fn];
        rerender();
        expect(result.current[fn]).toBe(ref);
      },
    );

    it("executeSearch reference updates when searchQuery changes", () => {
      const { result } = renderHook(() => useCircleSearch());
      const ref = result.current.executeSearch;
      act(() => result.current.setSearchQuery("new query"));
      expect(result.current.executeSearch).not.toBe(ref);
    });

    it("handleSuggestionSelect is stable across rerenders", () => {
      const { result, rerender } = renderHook(() => useCircleSearch());
      const ref = result.current.handleSuggestionSelect;
      rerender();
      expect(result.current.handleSuggestionSelect).toBe(ref);
    });
  });
});
