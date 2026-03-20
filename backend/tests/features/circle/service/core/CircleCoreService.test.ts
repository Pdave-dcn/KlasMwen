import { describe, it, expect, beforeEach, vi } from "vitest";
import { CircleCoreService } from "../../../../../src/features/circle/service/core/CircleCoreService.js";
import CircleRepository from "../../../../../src/features/circle/service/Repositories/CircleRepository.js";
import CircleEnricher from "../../../../../src/features/circle/service/CircleEnrichers.js";
import CircleTransformers from "../../../../../src/features/circle/service/CircleTransformers.js";
import { getRandomCircleAvatar } from "../../../../../src/features/avatar/avatarService.js";
import { assertCirclePermission } from "../../../../../src/features/circle/security/rbac.js";
import { AuthorizationError } from "../../../../../src/core/error/custom/auth.error.js";
import {
  CircleNotFoundError,
  AlreadyMemberError,
  CircleMemberNotFoundError,
} from "../../../../../src/core/error/custom/circle.error.js";
import { CircleRole } from "@prisma/client";

vi.mock(
  "../../../../../src/features/circle/service/Repositories/CircleRepository.js",
);
vi.mock("../../../../../src/features/circle/service/CircleEnrichers.js");
vi.mock("../../../../../src/features/circle/service/CircleTransformers.js");
vi.mock("../../../../../src/features/avatar/avatarService.js");
vi.mock("../../../../../src/features/circle/security/rbac.js");

describe("CircleCoreService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAvatar = {
    id: 1,
    url: "http://example.com/avatar.png",
  };

  const mockCreator = {
    id: "user-1",
    username: "TestUser",
  };

  const mockCircleData = {
    name: "Test Circle",
    description: "A test circle",
    isPrivate: false,
    creatorId: "user-1",
    tagIds: [1],
  };

  describe("createCircle", () => {
    it("should create a circle with random avatar and enrich it", async () => {
      const mockCreatedCircle = {
        id: "circle-1",
        ...mockCircleData,
        creator: mockCreator,
        avatar: mockAvatar,
        _count: { members: 0 },
        createdAt: new Date(),
        members: [],
        messages: [],
        circleTags: [],
      };

      const mockEnrichedCircle = {
        ...mockCreatedCircle,
        memberCount: 1,
        userRole: "OWNER" as const,
        latestMessage: null,
        unreadCount: 0,
        tags: [],
      };

      vi.mocked(getRandomCircleAvatar).mockResolvedValue(mockAvatar);
      vi.mocked(CircleRepository.createCircle).mockResolvedValue(
        mockCreatedCircle,
      );
      vi.mocked(CircleEnricher.enrichCircle).mockResolvedValue(
        mockEnrichedCircle,
      );

      const result = await CircleCoreService.createCircle(mockCircleData);

      expect(getRandomCircleAvatar).toHaveBeenCalled();
      expect(CircleRepository.createCircle).toHaveBeenCalledWith({
        ...mockCircleData,
        avatarId: 1,
      });
      expect(CircleEnricher.enrichCircle).toHaveBeenCalledWith(
        mockCreatedCircle,
        "user-1",
      );
      expect(result).toEqual(mockEnrichedCircle);
    });

    it("should handle avatar service errors", async () => {
      const mockCircleData = {
        name: "Test Circle",
        description: "A test circle",
        isPrivate: false,
        creatorId: "user-1",
        tagIds: [],
      };

      vi.mocked(getRandomCircleAvatar).mockRejectedValue(
        new Error("Avatar service error"),
      );

      await expect(
        CircleCoreService.createCircle(mockCircleData),
      ).rejects.toThrow("Avatar service error");
    });
  });

  describe("joinCircle", () => {
    it("should allow a user to join a public circle", async () => {
      const mockCircle = {
        id: "circle-1",
        ...mockCircleData,
        name: "Public Circle",
        isPrivate: false,
        creatorId: "user-1",
        creator: mockCreator,
        avatar: mockAvatar,
        _count: { members: 0 },
        createdAt: new Date(),
        members: [],
        messages: [],
        circleTags: [],
      };

      const mockMember = {
        userId: "user-2",
        role: "MEMBER" as const,
        user: {
          id: "user-2",
          username: "TestUser2",
          Avatar: null,
        },
        joinedAt: new Date(),
        mutedUntil: null,
      };

      const mockEnrichedCircle = {
        ...mockCircle,
        memberCount: 1,
        userRole: "OWNER" as const,
        latestMessage: null,
        unreadCount: 0,
        tags: [],
      };

      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(mockCircle);
      vi.mocked(CircleRepository.isMember).mockResolvedValue(false);
      vi.mocked(CircleRepository.addMember).mockResolvedValue(mockMember);
      vi.mocked(CircleEnricher.enrichCircle).mockResolvedValue(
        mockEnrichedCircle,
      );

      const result = await CircleCoreService.joinCircle("circle-1", "user-2");

      expect(CircleRepository.findCircleById).toHaveBeenCalledWith("circle-1");
      expect(CircleRepository.isMember).toHaveBeenCalledWith(
        "user-2",
        "circle-1",
      );
      expect(CircleRepository.addMember).toHaveBeenCalledWith({
        userId: "user-2",
        circleId: "circle-1",
        role: "MEMBER",
      });
      expect(result).toEqual(mockEnrichedCircle);
    });

    it("should throw CircleNotFoundError if circle does not exist", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(null);

      await expect(
        CircleCoreService.joinCircle("circle-1", "user-2"),
      ).rejects.toThrow(CircleNotFoundError);
    });

    it("should throw AuthorizationError if trying to join a private circle", async () => {
      const mockCircle = {
        id: "circle-1",
        name: "Private Circle",
        isPrivate: true,
      } as any;

      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(mockCircle);

      await expect(
        CircleCoreService.joinCircle("circle-1", "user-2"),
      ).rejects.toThrow(AuthorizationError);
    });

    it("should throw AlreadyMemberError if user is already a member", async () => {
      const mockCircle = {
        id: "circle-1",
        name: "Public Circle",
        isPrivate: false,
      } as any;

      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(mockCircle);
      vi.mocked(CircleRepository.isMember).mockResolvedValue(true);

      await expect(
        CircleCoreService.joinCircle("circle-1", "user-2"),
      ).rejects.toThrow(AlreadyMemberError);
    });
  });

  describe("leaveCircle", () => {
    const mockRequester = {
      id: "user-2",
      username: "TestUser2",
      email: "testuser2@example.com",
      role: "STUDENT" as const,
      circleRole: "MEMBER" as CircleRole,
    };

    const mockCircle = {
      id: "circle-1",
      creator: mockCreator,
      avatar: mockAvatar,
      _count: { members: 1 },
      createdAt: new Date(),
      members: [],
      messages: [],
      circleTags: [],
      ...mockCircleData,
    };

    const mockMembership = {
      userId: "user-2",
      circleId: "circle-1",
      role: "MEMBER" as CircleRole,
      joinedAt: new Date(),
      mutedUntil: null,
    } as any;

    it("should allow a member to leave a circle", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(mockCircle);
      vi.mocked(CircleRepository.getMembership).mockResolvedValue(
        mockMembership,
      );
      vi.mocked(assertCirclePermission).mockReturnValue(undefined);
      vi.mocked(CircleRepository.removeMember).mockResolvedValue(
        mockMembership,
      );

      const result = await CircleCoreService.leaveCircle(
        "circle-1",
        mockRequester,
      );

      expect(CircleRepository.findCircleById).toHaveBeenCalledWith("circle-1");
      expect(CircleRepository.getMembership).toHaveBeenCalledWith(
        "user-2",
        "circle-1",
      );
      expect(assertCirclePermission).toHaveBeenCalledWith(
        mockRequester,
        "circles",
        "leave",
      );
      expect(CircleRepository.removeMember).toHaveBeenCalledWith(
        "user-2",
        "circle-1",
      );
      expect(result).toEqual(mockMembership);
    });

    it("should throw CircleNotFoundError if circle does not exist", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(null);

      await expect(
        CircleCoreService.leaveCircle("circle-1", mockRequester),
      ).rejects.toThrow(CircleNotFoundError);

      expect(CircleRepository.getMembership).not.toHaveBeenCalled();
      expect(CircleRepository.removeMember).not.toHaveBeenCalled();
    });

    it("should throw CircleMemberNotFoundError if user is not a member", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(mockCircle);
      vi.mocked(CircleRepository.getMembership).mockResolvedValue(null);

      await expect(
        CircleCoreService.leaveCircle("circle-1", mockRequester),
      ).rejects.toThrow(CircleMemberNotFoundError);

      expect(assertCirclePermission).not.toHaveBeenCalled();
      expect(CircleRepository.removeMember).not.toHaveBeenCalled();
    });

    it("should throw AuthorizationError if user lacks leave permission", async () => {
      const ownerRequester = {
        id: "user-1",
        username: "OwnerUser",
        circleRole: "OWNER" as CircleRole,
      };

      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(mockCircle);
      vi.mocked(CircleRepository.getMembership).mockResolvedValue({
        ...mockMembership,
        userId: "user-1",
        role: "OWNER" as CircleRole,
      });
      vi.mocked(assertCirclePermission).mockImplementation(() => {
        throw new AuthorizationError(
          "Owners cannot leave without transferring ownership",
        );
      });

      await expect(
        CircleCoreService.leaveCircle("circle-1", ownerRequester),
      ).rejects.toThrow(AuthorizationError);

      expect(CircleRepository.removeMember).not.toHaveBeenCalled();
    });
  });

  describe("getCircleById", () => {
    it("should retrieve and enrich a circle by ID with user ID", async () => {
      const mockCircle = {
        id: "circle-1",
        name: "Test Circle",
        description: "A test circle",
      } as any;
      const mockEnrichedCircle = { ...mockCircle, userRole: "MEMBER" };

      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(mockCircle);
      vi.mocked(CircleEnricher.enrichCircle).mockResolvedValue(
        mockEnrichedCircle,
      );

      const result = await CircleCoreService.getCircleById(
        "circle-1",
        "user-1",
      );

      expect(CircleRepository.findCircleById).toHaveBeenCalledWith("circle-1");
      expect(CircleEnricher.enrichCircle).toHaveBeenCalledWith(
        mockCircle,
        "user-1",
      );
      expect(result).toEqual(mockEnrichedCircle);
    });

    it("should retrieve and enrich a circle by ID without user ID", async () => {
      const mockCircle = {
        id: "circle-1",
        name: "Test Circle",
        description: "A test circle",
      } as any;
      const mockEnrichedCircle = { ...mockCircle };

      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(mockCircle);
      vi.mocked(CircleEnricher.enrichCircle).mockResolvedValue(
        mockEnrichedCircle,
      );

      const result = await CircleCoreService.getCircleById(
        "circle-1",
        "user-1",
      );

      expect(CircleRepository.findCircleById).toHaveBeenCalledWith("circle-1");
      expect(CircleEnricher.enrichCircle).toHaveBeenCalledWith(
        mockCircle,
        "user-1",
      );
      expect(result).toEqual(mockEnrichedCircle);
    });

    it("should throw CircleNotFoundError if circle does not exist", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(null);

      await expect(
        CircleCoreService.getCircleById("circle-1", "user-1"),
      ).rejects.toThrow(CircleNotFoundError);
    });
  });

  describe("getCirclePreviewDetails", () => {
    it("should retrieve and transform circle details", async () => {
      const mockCircleDetails = {
        id: "circle-1",
        name: "Test Circle",
        description: "A test circle",
        createdAt: new Date(),
      } as any;
      const mockTransformedDetails = {
        ...mockCircleDetails,
        transformed: true,
      };

      vi.mocked(CircleRepository.getCircleDetails).mockResolvedValue(
        mockCircleDetails,
      );
      vi.mocked(
        CircleTransformers.transformCircleForDetailPage,
      ).mockReturnValue(mockTransformedDetails);

      const result =
        await CircleCoreService.getCirclePreviewDetails("circle-1");

      expect(CircleRepository.getCircleDetails).toHaveBeenCalledWith(
        "circle-1",
      );
      expect(
        CircleTransformers.transformCircleForDetailPage,
      ).toHaveBeenCalledWith(mockCircleDetails);
      expect(result).toEqual(mockTransformedDetails);
    });

    it("should throw CircleNotFoundError if circle details do not exist", async () => {
      vi.mocked(CircleRepository.getCircleDetails).mockResolvedValue(null);

      await expect(
        CircleCoreService.getCirclePreviewDetails("circle-1"),
      ).rejects.toThrow(CircleNotFoundError);
    });
  });

  describe("getUserCircles", () => {
    it("should retrieve all circles for a user and enrich them", async () => {
      const mockCircles = [
        { id: "circle-1", name: "Circle 1" },
        { id: "circle-2", name: "Circle 2" },
      ] as any[];
      const mockEnrichedCircles = [
        { ...mockCircles[0], userRole: "MEMBER" },
        { ...mockCircles[1], userRole: "OWNER" },
      ];

      vi.mocked(CircleRepository.findUserCircles).mockResolvedValue(
        mockCircles,
      );
      vi.mocked(CircleEnricher.enrichCircles).mockResolvedValueOnce(
        mockEnrichedCircles,
      );

      const result = await CircleCoreService.getUserCircles("user-1");

      expect(CircleRepository.findUserCircles).toHaveBeenCalledWith("user-1");
      expect(CircleEnricher.enrichCircles).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockEnrichedCircles);
    });

    it("should return empty array if user has no circles", async () => {
      vi.mocked(CircleRepository.findUserCircles).mockResolvedValue([]);
      vi.mocked(CircleEnricher.enrichCircles).mockResolvedValueOnce([]);

      const result = await CircleCoreService.getUserCircles("user-1");

      expect(CircleEnricher.enrichCircles).toHaveBeenCalled();

      expect(result).toEqual([]);
    });
  });

  describe("getRecentActivityCircles", () => {
    it("should return sorted circles by recent activity with default limit", async () => {
      const mockCircles = [
        {
          id: "circle-1",
          name: "Circle 1",
          createdAt: new Date("2024-01-01"),
          latestMessage: { createdAt: new Date("2024-01-10") },
          unreadCount: 0,
        },
        {
          id: "circle-2",
          name: "Circle 2",
          createdAt: new Date("2024-01-02"),
          latestMessage: { createdAt: new Date("2024-01-05") },
          unreadCount: 2,
        },
      ] as any[];

      vi.mocked(
        CircleRepository.findRecentCirclesWithActivity,
      ).mockResolvedValue(mockCircles);
      vi.mocked(CircleEnricher.enrichCircles).mockResolvedValue(mockCircles);

      const result = await CircleCoreService.getRecentActivityCircles("user-1");

      expect(
        CircleRepository.findRecentCirclesWithActivity,
      ).toHaveBeenCalledWith("user-1", 15);
      expect(CircleEnricher.enrichCircles).toHaveBeenCalledWith(
        mockCircles,
        "user-1",
      );
      expect(result.length).toBeLessThanOrEqual(8);
    });

    it("should prioritize circles with unread messages", async () => {
      const mockCircles = [
        {
          id: "circle-1",
          name: "Circle 1",
          createdAt: new Date("2024-01-01"),
          latestMessage: { createdAt: new Date("2024-01-10") },
          unreadCount: 0,
        },
        {
          id: "circle-2",
          name: "Circle 2",
          createdAt: new Date("2024-01-02"),
          latestMessage: { createdAt: new Date("2024-01-05") },
          unreadCount: 2,
        },
      ] as any[];

      vi.mocked(
        CircleRepository.findRecentCirclesWithActivity,
      ).mockResolvedValue(mockCircles);
      vi.mocked(CircleEnricher.enrichCircles).mockResolvedValue(mockCircles);

      const result = await CircleCoreService.getRecentActivityCircles(
        "user-1",
        10,
      );

      expect(result[0].unreadCount).toBeGreaterThan(0);
    });

    it("should respect custom limit", async () => {
      const mockCircles = Array.from({ length: 20 }, (_, i) => ({
        id: `circle-${i}`,
        name: `Circle ${i}`,
        createdAt: new Date(),
        latestMessage: null,
        unreadCount: 0,
      })) as any[];

      vi.mocked(
        CircleRepository.findRecentCirclesWithActivity,
      ).mockResolvedValue(mockCircles);
      vi.mocked(CircleEnricher.enrichCircles).mockResolvedValue(mockCircles);

      const result = await CircleCoreService.getRecentActivityCircles(
        "user-1",
        5,
      );

      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe("updateCircle", () => {
    it("should update circle details if user has permission", async () => {
      const mockUser = { id: "user-1", circleRole: "OWNER" as const };
      const mockCircle = {
        id: "circle-1",
        name: "Old Name",
        description: "Old Description",
        isPrivate: false,
        creatorId: "user-1",
      } as any;
      const updateData = {
        name: "New Name",
        description: "New Description",
        isPrivate: true,
        avatarId: 2,
        tagIds: [1, 2],
      };
      const mockUpdatedCircle = { ...mockCircle, ...updateData };
      const mockEnrichedCircle = { ...mockUpdatedCircle, userRole: "OWNER" };

      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(mockCircle);
      vi.mocked(assertCirclePermission).mockReturnValue(undefined);
      vi.mocked(CircleRepository.updateCircle).mockResolvedValue(
        mockUpdatedCircle,
      );
      vi.mocked(CircleEnricher.enrichCircle).mockResolvedValue(
        mockEnrichedCircle,
      );

      const result = await CircleCoreService.updateCircle(
        "circle-1",
        mockUser,
        updateData,
      );

      expect(CircleRepository.findCircleById).toHaveBeenCalledWith("circle-1");
      expect(assertCirclePermission).toHaveBeenCalledWith(
        mockUser,
        "circles",
        "update",
        mockCircle,
      );
      expect(CircleRepository.updateCircle).toHaveBeenCalledWith(
        "circle-1",
        updateData,
      );
      expect(result).toEqual(mockEnrichedCircle);
    });

    it("should throw CircleNotFoundError if circle does not exist", async () => {
      const mockUser = { id: "user-1", circleRole: "OWNER" as const };
      const updateData = {
        name: "New Name",
        description: "",
        isPrivate: false,
        avatarId: 2,
        tagIds: [1, 2],
      };

      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(null);

      await expect(
        CircleCoreService.updateCircle("circle-1", mockUser, updateData),
      ).rejects.toThrow(CircleNotFoundError);
    });

    it("should throw AuthorizationError if user lacks permission", async () => {
      const mockUser = { id: "user-2", circleRole: "MEMBER" as const };
      const mockCircle = {
        id: "circle-1",
        name: "Test Circle",
        creatorId: "user-1",
      } as any;
      const updateData = {
        name: "New Name",
        description: "",
        isPrivate: false,
        avatarId: 2,
        tagIds: [1, 2],
      };

      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(mockCircle);
      vi.mocked(assertCirclePermission).mockImplementation(() => {
        throw new AuthorizationError("Insufficient permissions");
      });

      await expect(
        CircleCoreService.updateCircle("circle-1", mockUser, updateData),
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe("deleteCircle", () => {
    it("should delete circle if user is owner", async () => {
      const mockUser = { id: "user-1", circleRole: "OWNER" as const };
      const mockCircle = {
        id: "circle-1",
        name: "Test Circle",
        creatorId: "user-1",
      } as any;
      const mockDeletedCircle = { ...mockCircle };

      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(mockCircle);
      vi.mocked(assertCirclePermission).mockReturnValue(undefined);
      vi.mocked(CircleRepository.deleteCircle).mockResolvedValue(
        mockDeletedCircle,
      );

      const result = await CircleCoreService.deleteCircle("circle-1", mockUser);

      expect(CircleRepository.findCircleById).toHaveBeenCalledWith("circle-1");
      expect(assertCirclePermission).toHaveBeenCalledWith(
        mockUser,
        "circles",
        "delete",
        mockCircle,
      );
      expect(CircleRepository.deleteCircle).toHaveBeenCalledWith("circle-1");
      expect(result).toEqual(mockDeletedCircle);
    });

    it("should throw CircleNotFoundError if circle does not exist", async () => {
      const mockUser = { id: "user-1", circleRole: "OWNER" as const };

      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(null);

      await expect(
        CircleCoreService.deleteCircle("circle-1", mockUser),
      ).rejects.toThrow(CircleNotFoundError);
    });

    it("should throw AuthorizationError if user is not owner", async () => {
      const mockUser = { id: "user-2", circleRole: "MEMBER" as const };
      const mockCircle = {
        id: "circle-1",
        name: "Test Circle",
        creatorId: "user-1",
      } as any;

      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(mockCircle);
      vi.mocked(assertCirclePermission).mockImplementation(() => {
        throw new AuthorizationError("Only owner can delete circle");
      });

      await expect(
        CircleCoreService.deleteCircle("circle-1", mockUser),
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe("getCircleAvatars", () => {
    const makeAvatars = (count: number) =>
      Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        url: `https://example.com/${i + 1}.png`,
      }));

    it("should return data and pagination when results are within the limit", async () => {
      const avatars = makeAvatars(5);
      vi.mocked(CircleRepository.getCircleAvatars).mockResolvedValue(avatars);

      const result = await CircleCoreService.getCircleAvatars(20);

      expect(CircleRepository.getCircleAvatars).toHaveBeenCalledWith(
        20,
        undefined,
      );
      expect(result.data).toHaveLength(5);
      expect(result.data).toEqual(avatars);
      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.nextCursor).toBeNull();
    });

    it("should indicate hasMore and set nextCursor when repository returns limit + 1 items", async () => {
      // repository fetches limit+1 to detect overflow — 21 items for a limit of 20
      const avatars = makeAvatars(21);
      vi.mocked(CircleRepository.getCircleAvatars).mockResolvedValue(avatars);

      const result = await CircleCoreService.getCircleAvatars(20);

      expect(result.data).toHaveLength(20);
      expect(result.pagination.hasMore).toBe(true);
      expect(result.pagination.nextCursor).toBe(20); // id of the last item in the sliced page
    });

    it("should pass cursor to the repository", async () => {
      vi.mocked(CircleRepository.getCircleAvatars).mockResolvedValue([]);

      await CircleCoreService.getCircleAvatars(20, 42);

      expect(CircleRepository.getCircleAvatars).toHaveBeenCalledWith(20, 42);
    });

    it("should use the default limit of 20 when none is provided", async () => {
      vi.mocked(CircleRepository.getCircleAvatars).mockResolvedValue([]);

      await CircleCoreService.getCircleAvatars();

      expect(CircleRepository.getCircleAvatars).toHaveBeenCalledWith(
        20,
        undefined,
      );
    });

    it("should return empty data with no next cursor when repository returns nothing", async () => {
      vi.mocked(CircleRepository.getCircleAvatars).mockResolvedValue([]);

      const result = await CircleCoreService.getCircleAvatars(20);

      expect(result.data).toEqual([]);
      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.nextCursor).toBeNull();
    });

    it("should set nextCursor to the id of the last item on the page, not the overflow item", async () => {
      const avatars = makeAvatars(11); // limit=10, +1 overflow
      vi.mocked(CircleRepository.getCircleAvatars).mockResolvedValue(avatars);

      const result = await CircleCoreService.getCircleAvatars(10);

      expect(result.data).toHaveLength(10);
      expect(result.pagination.nextCursor).toBe(10); // id 10, not 11
    });

    it("should return exactly limit items when results equal the limit (no overflow)", async () => {
      const avatars = makeAvatars(20);
      vi.mocked(CircleRepository.getCircleAvatars).mockResolvedValue(avatars);

      const result = await CircleCoreService.getCircleAvatars(20);

      expect(result.data).toHaveLength(20);
      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.nextCursor).toBeNull();
    });
  });
});
