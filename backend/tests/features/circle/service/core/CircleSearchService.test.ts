import { describe, it, expect, beforeEach, vi } from "vitest";
import { CircleSearchService } from "../../../../../src/features/circle/service/core/CircleSearchService.js";
import CircleSearchRepository from "../../../../../src/features/circle/service/Repositories/CircleSearchRepository.js";
import CircleRepository from "../../../../../src/features/circle/service/Repositories/CircleRepository.js";
import CircleTransformers from "../../../../../src/features/circle/service/CircleTransformers.js";
import { CircleNotFoundError } from "../../../../../src/core/error/custom/circle.error.js";

vi.mock(
  "../../../../../src/features/circle/service/Repositories/CircleSearchRepository.js",
);
vi.mock(
  "../../../../../src/features/circle/service/Repositories/CircleRepository.js",
);
vi.mock("../../../../../src/features/circle/service/CircleTransformers.js");

const exampleGroup = { id: "circle-1", name: "Test" };
const transformedGroup = { id: "circle-1", name: "Test", memberCount: 0 };

const pagination = { limit: 1 };

describe("CircleSearchService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("searchCircles", () => {
    it("should query repository and return processed results", async () => {
      vi.mocked(CircleSearchRepository.searchCircles).mockResolvedValue([
        exampleGroup,
      ] as any);
      vi.mocked(
        CircleTransformers.transformCirclesForDiscovery,
      ).mockReturnValue([transformedGroup] as any);

      const filters = { query: "foo" } as any;
      const res = await CircleSearchService.searchCircles(
        "user-1",
        filters,
        pagination as any,
      );

      expect(CircleSearchRepository.searchCircles).toHaveBeenCalledWith(
        "user-1",
        filters,
        pagination,
      );
      expect(res.data).toEqual([transformedGroup]);
      expect(res.pagination.hasMore).toBe(false);
    });
  });

  describe("discoverCircles", () => {
    it("should call findPublicCircles and transform", async () => {
      vi.mocked(CircleSearchRepository.findPublicCircles).mockResolvedValue([
        exampleGroup,
      ] as any);
      vi.mocked(
        CircleTransformers.transformCirclesForDiscovery,
      ).mockReturnValue([transformedGroup] as any);

      const res = await CircleSearchService.discoverCircles(
        "user-x",
        pagination as any,
      );
      expect(CircleSearchRepository.findPublicCircles).toHaveBeenCalledWith(
        "user-x",
        pagination,
      );
      expect(res.data).toEqual([transformedGroup]);
    });
  });

  describe("getRecommendedCircles", () => {
    it("should query popular circles and transform", async () => {
      vi.mocked(CircleSearchRepository.findPopularCircles).mockResolvedValue([
        exampleGroup,
      ] as any);
      vi.mocked(
        CircleTransformers.transformCirclesForDiscovery,
      ).mockReturnValue([transformedGroup] as any);

      const res = await CircleSearchService.getRecommendedCircles(
        "u",
        pagination as any,
      );
      expect(CircleSearchRepository.findPopularCircles).toHaveBeenCalledWith(
        "u",
        pagination,
      );
      expect(res.data).toEqual([transformedGroup]);
    });
  });

  describe("getTrendingCircles", () => {
    it("should fetch trending and respect timeframe", async () => {
      vi.mocked(CircleSearchRepository.findTrendingCircles).mockResolvedValue([
        exampleGroup,
      ] as any);
      vi.mocked(
        CircleTransformers.transformCirclesForDiscovery,
      ).mockReturnValue([transformedGroup] as any);

      const res = await CircleSearchService.getTrendingCircles(
        "u",
        pagination as any,
        5,
      );
      expect(CircleSearchRepository.findTrendingCircles).toHaveBeenCalledWith(
        "u",
        pagination,
        5,
      );
      expect(res.data).toEqual([transformedGroup]);
    });
  });

  describe("getSimilarCircles", () => {
    it("should throw if reference circle not found", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(null);
      await expect(
        CircleSearchService.getSimilarCircles("u", "ref", pagination as any),
      ).rejects.toThrow(CircleNotFoundError);
    });

    it("should call search repository with reference info", async () => {
      const reference = {
        id: "ref",
        name: "Ref Name",
        creator: { id: "creator" },
      };
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(
        reference as any,
      );
      vi.mocked(CircleSearchRepository.findSimilarCircles).mockResolvedValue([
        exampleGroup,
      ] as any);
      vi.mocked(
        CircleTransformers.transformCirclesForDiscovery,
      ).mockReturnValue([transformedGroup] as any);

      const res = await CircleSearchService.getSimilarCircles(
        "u",
        "ref",
        pagination as any,
      );
      expect(CircleSearchRepository.findSimilarCircles).toHaveBeenCalledWith(
        "u",
        { id: "ref", name: "Ref Name", creatorId: "creator" },
        pagination,
      );
      expect(res.data).toEqual([transformedGroup]);
    });
  });

  describe("getNewCircles", () => {
    it("should fetch and transform new circles", async () => {
      vi.mocked(CircleSearchRepository.findNewCircles).mockResolvedValue([
        exampleGroup,
      ] as any);
      vi.mocked(
        CircleTransformers.transformCirclesForDiscovery,
      ).mockReturnValue([transformedGroup] as any);

      const res = await CircleSearchService.getNewCircles(
        "u",
        pagination as any,
      );
      expect(CircleSearchRepository.findNewCircles).toHaveBeenCalledWith(
        "u",
        pagination,
      );
      expect(res.data).toEqual([transformedGroup]);
    });
  });

  describe("getActiveCircles", () => {
    it("should pass activityDays and transform result", async () => {
      vi.mocked(CircleSearchRepository.findActiveCircles).mockResolvedValue([
        exampleGroup,
      ] as any);
      vi.mocked(
        CircleTransformers.transformCirclesForDiscovery,
      ).mockReturnValue([transformedGroup] as any);

      const res = await CircleSearchService.getActiveCircles(
        "u",
        pagination as any,
        2,
      );
      expect(CircleSearchRepository.findActiveCircles).toHaveBeenCalledWith(
        "u",
        pagination,
        2,
      );
      expect(res.data).toEqual([transformedGroup]);
    });
  });

  describe("getSmallCircles", () => {
    it("should fetch small circles with default maxMembers", async () => {
      vi.mocked(CircleSearchRepository.findSmallCircles).mockResolvedValue([
        exampleGroup,
      ] as any);
      vi.mocked(
        CircleTransformers.transformCirclesForDiscovery,
      ).mockReturnValue([transformedGroup] as any);

      const res = await CircleSearchService.getSmallCircles(
        "u",
        pagination as any,
      );
      expect(CircleSearchRepository.findSmallCircles).toHaveBeenCalledWith(
        "u",
        pagination,
        10,
      );
      expect(res.data).toEqual([transformedGroup]);
    });
  });

  describe("getCirclesByCreator", () => {
    it("should fetch circles by creator and transform", async () => {
      vi.mocked(CircleSearchRepository.findCirclesByCreator).mockResolvedValue([
        exampleGroup,
      ] as any);
      vi.mocked(
        CircleTransformers.transformCirclesForDiscovery,
      ).mockReturnValue([transformedGroup] as any);

      const res = await CircleSearchService.getCirclesByCreator(
        "u",
        "creator-1",
        pagination as any,
      );
      expect(CircleSearchRepository.findCirclesByCreator).toHaveBeenCalledWith(
        "u",
        "creator-1",
        pagination,
      );
      expect(res.data).toEqual([transformedGroup]);
    });
  });

  describe("getSearchSuggestions", () => {
    it("should return transformed suggestions", async () => {
      vi.mocked(CircleSearchRepository.getSearchSuggestions).mockResolvedValue([
        exampleGroup,
      ] as any);
      vi.mocked(
        CircleTransformers.transformCirclesForSuggestion,
      ).mockReturnValue([transformedGroup] as any);

      const res = await CircleSearchService.getSearchSuggestions("foo", 5);
      expect(CircleSearchRepository.getSearchSuggestions).toHaveBeenCalledWith(
        "foo",
        5,
      );
      expect(res).toEqual([transformedGroup]);
    });
  });
});
