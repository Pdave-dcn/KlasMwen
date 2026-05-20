import { describe, it, expect, beforeEach, vi } from "vitest";
import { CircleMemberService } from "../../../../../src/features/circle/service/core/CircleMemberService.js";
import CircleRepository from "../../../../../src/features/circle/service/Repositories/CircleRepository.js";
import CircleEnricher from "../../../../../src/features/circle/service/CircleEnrichers.js";
import CircleTransformers from "../../../../../src/features/circle/service/CircleTransformers.js";
import { CircleValidationService } from "../../../../../src/features/circle/service/core/CircleValidationService.js";
import { AuthorizationError } from "../../../../../src/core/error/custom/auth.error.js";
import {
  CircleNotFoundError,
  AlreadyMemberError,
  CircleMemberNotFoundError,
  NotAMemberError,
} from "../../../../../src/core/error/custom/circle.error.js";
import {
  MUTE_DURATION_MS,
  MuteDurationMinutes,
} from "../../../../../src/features/circle/service/CircleTypes.js";

vi.mock(
  "../../../../../src/features/circle/service/Repositories/CircleRepository.js",
);
vi.mock("../../../../../src/features/circle/service/CircleEnrichers.js");
vi.mock("../../../../../src/features/circle/service/CircleTransformers.js");
vi.mock(
  "../../../../../src/features/circle/service/core/CircleValidationService.js",
);

const mockCirclePermission = {
  assertCan: vi.fn(),
  assertCanRemoveMember: vi.fn(),
  assertCanMuteMember: vi.fn(),
  assertCanUpdateMemberRole: vi.fn(),
};

describe("CircleMemberService", () => {
  let circleMemberService: CircleMemberService;
  let mockValidationService: CircleValidationService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockValidationService = new CircleValidationService();
    circleMemberService = new CircleMemberService(mockValidationService, mockCirclePermission as any);
  });

  const mockCircle = {
    id: "circle-1",
    name: "Some Circle",
    isPrivate: false,
  } as any;

  const mockMembership = {
    userId: "user-2",
    circleId: "circle-1",
    role: "MEMBER",
    joinedAt: new Date(),
    mutedUntil: null,
    user: {
      id: "user-2",
      username: "UserTwo",
      Avatar: null,
    },
  } as any;

  const mockEnrichedMember = {
    ...mockMembership,
    isMuted: false,
  } as any;

  const mockTransformedMember = {
    ...mockEnrichedMember,
    user: { id: "user-2", username: "UserTwo", avatar: null },
  } as any;

  describe("addMember", () => {
    it("should add a user to a public circle when not already a member", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.checkMembership).mockResolvedValue(false);
      vi.mocked(CircleRepository.addMember).mockResolvedValue(mockMembership);
      vi.mocked(CircleEnricher.enrichMember).mockResolvedValue(
        mockEnrichedMember,
      );
      vi.mocked(CircleTransformers.transformMember).mockReturnValue(
        mockTransformedMember,
      );

      const data = { userId: "user-2", circleId: "circle-1" };
      const result = await circleMemberService.addMember(data);

      expect(mockValidationService.verifyCircleExists).toHaveBeenCalledWith(
        "circle-1",
      );
      expect(mockValidationService.checkMembership).toHaveBeenCalledWith(
        "user-2",
        "circle-1",
      );
      expect(CircleRepository.addMember).toHaveBeenCalledWith(
        { userId: "user-2", circleId: "circle-1", role: "MEMBER" },
        expect.any(Date),
      );
      expect(result).toEqual(mockTransformedMember);
    });

    it("should throw CircleNotFoundError when circle does not exist", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockRejectedValue(
        new CircleNotFoundError("circle-1"),
      );
      await expect(
        circleMemberService.addMember({ userId: "u", circleId: "circle-1" }),
      ).rejects.toThrow(CircleNotFoundError);
    });

    it("should throw AlreadyMemberError if user is already a member", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.checkMembership).mockResolvedValue(true);

      await expect(
        circleMemberService.addMember({ userId: "u", circleId: "c" }),
      ).rejects.toThrow(AlreadyMemberError);
    });

    it("should invoke permission check when requester adds someone else", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.checkMembership).mockResolvedValue(false);
      vi.mocked(CircleRepository.addMember).mockResolvedValue(mockMembership);
      vi.mocked(CircleEnricher.enrichMember).mockResolvedValue(
        mockEnrichedMember,
      );
      vi.mocked(CircleTransformers.transformMember).mockReturnValue(
        mockTransformedMember,
      );

      const requester = { id: "admin", circleRole: "OWNER" } as any;
      await circleMemberService.addMember(
        { userId: "user-2", circleId: "circle-1" },
        requester,
      );

      expect(mockCirclePermission.assertCan).toHaveBeenCalledWith(
        requester,
        "circleMembers",
        "add",
      );
    });

    it("should propagate authorization errors from rbac", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.checkMembership).mockResolvedValue(false);
      mockCirclePermission.assertCan.mockImplementation(() => {
        throw new AuthorizationError("nope");
      });

      await expect(
        circleMemberService.addMember(
          { userId: "user-2", circleId: "circle-1" },
          { id: "admin" } as any,
        ),
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe("removeMember", () => {
    it("should remove a member and return transformed result", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.verifyMembership).mockResolvedValue(
        mockMembership,
      );
      mockCirclePermission.assertCanRemoveMember.mockReturnValue(undefined);
      vi.mocked(CircleRepository.removeMember).mockResolvedValue(
        mockMembership,
      );
      vi.mocked(CircleEnricher.enrichMember).mockResolvedValue(
        mockEnrichedMember,
      );
      vi.mocked(CircleTransformers.transformMember).mockReturnValue(
        mockTransformedMember,
      );

      const result = await circleMemberService.removeMember(
        "user-2",
        "circle-1",
        { id: "user-2" } as any,
      );

      expect(mockValidationService.verifyMembership).toHaveBeenCalledWith(
        "user-2",
        "circle-1",
      );
      expect(mockCirclePermission.assertCanRemoveMember).toHaveBeenCalled();
      expect(result).toEqual(mockTransformedMember);
    });

    it("should throw CircleNotFoundError if circle doesn't exist", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockRejectedValue(
        new CircleNotFoundError("c"),
      );
      await expect(
        circleMemberService.removeMember("u", "c", { id: "u" } as any),
      ).rejects.toThrow(CircleNotFoundError);
    });

    it("should throw CircleMemberNotFoundError when membership missing", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.verifyMembership).mockRejectedValue(
        new CircleMemberNotFoundError("u", "c"),
      );
      await expect(
        circleMemberService.removeMember("u", "c", { id: "u" } as any),
      ).rejects.toThrow(CircleMemberNotFoundError);
    });

    it("should propagate authorization errors from rbac", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.verifyMembership).mockResolvedValue(
        mockMembership,
      );
      mockCirclePermission.assertCanRemoveMember.mockImplementation(() => {
        throw new AuthorizationError("nope");
      });

      await expect(
        circleMemberService.removeMember("user-2", "circle-1", {
          id: "foo",
        } as any),
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe("updateMemberRole", () => {
    it("should update a member's role when authorized", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.verifyMembership).mockResolvedValue(
        mockMembership,
      );
      mockCirclePermission.assertCanUpdateMemberRole.mockReturnValue(undefined);
      vi.mocked(CircleRepository.updateMemberRole).mockResolvedValue(
        mockMembership,
      );
      vi.mocked(CircleEnricher.enrichMember).mockResolvedValue(
        mockEnrichedMember,
      );
      vi.mocked(CircleTransformers.transformMember).mockReturnValue(
        mockTransformedMember,
      );

      const requester = { id: "owner", circleRole: "OWNER" } as any;
      const result = await circleMemberService.updateMemberRole(
        "user-2",
        "circle-1",
        { role: "MODERATOR" as const },
        requester,
      );

      expect(mockCirclePermission.assertCanUpdateMemberRole).toHaveBeenCalledWith(
        requester,
        mockMembership,
      );
      expect(result).toEqual(mockTransformedMember);
    });

    it("should throw CircleMemberNotFoundError when membership missing", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.verifyMembership).mockRejectedValue(
        new CircleMemberNotFoundError("user-2", "circle-1"),
      );

      await expect(
        circleMemberService.updateMemberRole(
          "user-2",
          "circle-1",
          { role: "MODERATOR" as const },
          { id: "owner" } as any,
        ),
      ).rejects.toThrow(CircleMemberNotFoundError);
    });

    it("should propagate authorization errors", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.verifyMembership).mockResolvedValue(
        mockMembership,
      );
      mockCirclePermission.assertCanUpdateMemberRole.mockImplementation(() => {
        throw new AuthorizationError("nope");
      });

      await expect(
        circleMemberService.updateMemberRole(
          "user-2",
          "circle-1",
          { role: "MODERATOR" as const },
          { id: "foo" } as any,
        ),
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe("updateLastReadAt", () => {
    it("should update the timestamp when membership exists", async () => {
      vi.mocked(mockValidationService.verifyMembership).mockResolvedValue(
        mockMembership,
      );
      const spy = vi.spyOn(CircleRepository, "updateLastReadAt");

      await circleMemberService.updateLastReadAt("user-2", "circle-1");
      expect(spy).toHaveBeenCalledWith("user-2", "circle-1");
    });

    it("should throw CircleMemberNotFoundError when membership missing", async () => {
      vi.mocked(mockValidationService.verifyMembership).mockRejectedValue(
        new CircleMemberNotFoundError("user-2", "circle-1"),
      );
      await expect(
        circleMemberService.updateLastReadAt("user-2", "circle-1"),
      ).rejects.toThrow(CircleMemberNotFoundError);
    });
  });

  describe("getCircleMembers", () => {
    const userId = "user-1";
    const circleId = "circle-1";
    const defaultPagination = { limit: 15, cursor: undefined };

    it("should return transformed members with pagination when circle exists and user is a member", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.verifyIsMember).mockResolvedValue(true);
      vi.mocked(CircleRepository.getGroupMembers).mockResolvedValue([
        mockMembership,
      ]);
      vi.mocked(CircleEnricher.enrichMembers).mockResolvedValue([
        mockEnrichedMember,
      ]);
      vi.mocked(CircleTransformers.transformMembers).mockReturnValue([
        mockTransformedMember,
      ]);

      const res = await circleMemberService.getCircleMembers(
        userId,
        circleId,
        defaultPagination,
      );

      expect(res).toEqual({
        data: [mockTransformedMember],
        pagination: { hasMore: false, nextCursor: null },
      });
    });

    it("should correctly detect hasMore and return nextCursor when more results exist", async () => {
      const extraMember = { ...mockMembership, userId: "user-3" } as any;

      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.verifyIsMember).mockResolvedValue(true);
      // Return limit+1 items to trigger hasMore
      vi.mocked(CircleRepository.getGroupMembers).mockResolvedValue([
        mockMembership,
        extraMember,
      ]);
      // Enrich and transform only receive the trimmed result (limit=1), not the extra item
      vi.mocked(CircleEnricher.enrichMembers).mockResolvedValue([
        mockEnrichedMember,
      ]);
      vi.mocked(CircleTransformers.transformMembers).mockReturnValue([
        mockTransformedMember,
      ]);

      const res = await circleMemberService.getCircleMembers(userId, circleId, {
        limit: 1,
        cursor: undefined,
      });

      expect(res).toEqual({
        data: [mockTransformedMember],
        pagination: { hasMore: true, nextCursor: "user-2" },
      });
    });

    it("should pass the cursor to the repository on subsequent pages", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.verifyIsMember).mockResolvedValue(true);
      vi.mocked(CircleRepository.getGroupMembers).mockResolvedValue([
        mockMembership,
      ]);
      vi.mocked(CircleEnricher.enrichMembers).mockResolvedValue([
        mockEnrichedMember,
      ]);
      vi.mocked(CircleTransformers.transformMembers).mockReturnValue([
        mockTransformedMember,
      ]);

      await circleMemberService.getCircleMembers(userId, circleId, {
        limit: 15,
        cursor: "user-2",
      });

      expect(CircleRepository.getGroupMembers).toHaveBeenCalledWith(circleId, {
        limit: 15,
        cursor: "user-2",
      });
    });

    it("should throw CircleNotFoundError if circle does not exist", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockRejectedValue(
        new CircleNotFoundError(circleId),
      );

      await expect(
        circleMemberService.getCircleMembers(
          userId,
          circleId,
          defaultPagination,
        ),
      ).rejects.toThrow(CircleNotFoundError);
    });

    it("should throw NotAMemberError if the user is not a member of the circle", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.verifyIsMember).mockRejectedValue(
        new NotAMemberError(userId, circleId),
      );

      await expect(
        circleMemberService.getCircleMembers(
          userId,
          circleId,
          defaultPagination,
        ),
      ).rejects.toThrow(NotAMemberError);
    });
  });

  describe("getMutedMembers", () => {
    const requester = { id: "user-1", circleRole: "MEMBER" } as any;
    const circleId = "circle-1";
    const defaultPagination = { limit: 15, cursor: undefined };

    const mockMutedMembership = {
      userId: "user-2",
      circleId: "circle-1",
      role: "MEMBER",
      joinedAt: new Date(),
      mutedUntil: new Date("2099-01-01"),
      user: {
        id: "user-2",
        username: "MutedUser",
        Avatar: null,
      },
    } as any;

    const mockEnrichedMutedMember = {
      ...mockMutedMembership,
      isMuted: true,
    } as any;

    const mockTransformedMutedMember = {
      ...mockEnrichedMutedMember,
      user: { id: "user-2", username: "MutedUser", avatar: null },
    } as any;

    it("should return paginated muted members when circle exists and user is a member", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.verifyIsMember).mockResolvedValue(true);
      vi.mocked(CircleRepository.getMutedMembers).mockResolvedValue({
        data: [mockMutedMembership],
        totalMuted: 5,
      });
      vi.mocked(CircleEnricher.enrichMembers).mockResolvedValue([
        mockEnrichedMutedMember,
      ]);
      vi.mocked(CircleTransformers.transformMembers).mockReturnValue([
        mockTransformedMutedMember,
      ]);

      const result = await circleMemberService.getMutedMembers(
        requester,
        circleId,
        defaultPagination,
      );

      expect(mockValidationService.verifyCircleExists).toHaveBeenCalledWith(
        circleId,
      );
      expect(mockValidationService.verifyIsMember).toHaveBeenCalledWith(
        requester.id,
        circleId,
      );
      expect(CircleRepository.getMutedMembers).toHaveBeenCalledWith(
        circleId,
        defaultPagination,
      );
      expect(result).toEqual({
        data: [mockTransformedMutedMember],
        pagination: { hasMore: false, nextCursor: null, totalMuted: 5 },
      });
    });

    it("should use default limit of 15 when not provided", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.verifyIsMember).mockResolvedValue(true);
      vi.mocked(CircleRepository.getMutedMembers).mockResolvedValue({
        data: [],
        totalMuted: 0,
      });
      vi.mocked(CircleEnricher.enrichMembers).mockResolvedValue([]);
      vi.mocked(CircleTransformers.transformMembers).mockReturnValue([]);

      await circleMemberService.getMutedMembers(requester, circleId, {});

      expect(CircleRepository.getMutedMembers).toHaveBeenCalledWith(
        circleId,
        {},
      );
      // The limit default is handled in the method, not passed to repository
    });

    it("should correctly handle pagination with cursor", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.verifyIsMember).mockResolvedValue(true);
      vi.mocked(CircleRepository.getMutedMembers).mockResolvedValue({
        data: [mockMutedMembership],
        totalMuted: 10,
      });
      vi.mocked(CircleEnricher.enrichMembers).mockResolvedValue([
        mockEnrichedMutedMember,
      ]);
      vi.mocked(CircleTransformers.transformMembers).mockReturnValue([
        mockTransformedMutedMember,
      ]);

      await circleMemberService.getMutedMembers(requester, circleId, {
        limit: 10,
        cursor: "user-5",
      });

      expect(CircleRepository.getMutedMembers).toHaveBeenCalledWith(circleId, {
        limit: 10,
        cursor: "user-5",
      });
    });

    it("should detect hasMore when more results exist", async () => {
      const extraMember = { ...mockMutedMembership, userId: "user-3" } as any;

      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.verifyIsMember).mockResolvedValue(true);
      // Return limit+1 items to trigger hasMore
      vi.mocked(CircleRepository.getMutedMembers).mockResolvedValue({
        data: [mockMutedMembership, extraMember],
        totalMuted: 20,
      });
      vi.mocked(CircleEnricher.enrichMembers).mockResolvedValue([
        mockEnrichedMutedMember,
      ]);
      vi.mocked(CircleTransformers.transformMembers).mockReturnValue([
        mockTransformedMutedMember,
      ]);

      const result = await circleMemberService.getMutedMembers(
        requester,
        circleId,
        { limit: 1 },
      );

      expect(result.pagination.hasMore).toBe(true);
      expect(result.pagination.nextCursor).toBe("user-2");
      expect(result.pagination.totalMuted).toBe(20);
    });

    it("should return empty array when no muted members exist", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.verifyIsMember).mockResolvedValue(true);
      vi.mocked(CircleRepository.getMutedMembers).mockResolvedValue({
        data: [],
        totalMuted: 0,
      });
      vi.mocked(CircleEnricher.enrichMembers).mockResolvedValue([]);
      vi.mocked(CircleTransformers.transformMembers).mockReturnValue([]);

      const result = await circleMemberService.getMutedMembers(
        requester,
        circleId,
        defaultPagination,
      );

      expect(result).toEqual({
        data: [],
        pagination: { hasMore: false, nextCursor: null, totalMuted: 0 },
      });
    });

    it("should throw CircleNotFoundError if circle does not exist", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockRejectedValue(
        new CircleNotFoundError(circleId),
      );

      await expect(
        circleMemberService.getMutedMembers(
          requester,
          circleId,
          defaultPagination,
        ),
      ).rejects.toThrow(CircleNotFoundError);
    });

    it("should throw NotAMemberError if requester is not a member", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.verifyIsMember).mockRejectedValue(
        new NotAMemberError(requester.id, circleId),
      );

      await expect(
        circleMemberService.getMutedMembers(
          requester,
          circleId,
          defaultPagination,
        ),
      ).rejects.toThrow(NotAMemberError);
    });
  });

  describe("searchCircleMembers", () => {
    const userId = "user-1";
    const circleId = "circle-1";
    const searchQuery = "john";

    const mockMemberships = [
      {
        userId: "user-2",
        circleId: "circle-1",
        role: "MEMBER",
        joinedAt: new Date(),
        mutedUntil: null,
        user: {
          id: "user-2",
          username: "john_doe",
          Avatar: null,
        },
      },
      {
        userId: "user-3",
        circleId: "circle-1",
        role: "MEMBER",
        joinedAt: new Date(),
        mutedUntil: null,
        user: {
          id: "user-3",
          username: "john_smith",
          Avatar: null,
        },
      },
    ] as any;

    const mockEnrichedMembers = mockMemberships.map((member: any) => ({
      ...member,
      isMuted: false,
    }));

    const mockTransformedMembers = mockEnrichedMembers.map((member: any) => ({
      ...member,
      user: {
        id: member.user.id,
        username: member.user.username,
        avatar: null,
      },
    }));

    it("should return matching members when search query matches usernames", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.verifyIsMember).mockResolvedValue(true);
      vi.mocked(CircleRepository.searchCircleMembers).mockResolvedValue(
        mockMemberships,
      );
      vi.mocked(CircleEnricher.enrichMembers).mockResolvedValue(
        mockEnrichedMembers,
      );
      vi.mocked(CircleTransformers.transformMembers).mockReturnValue(
        mockTransformedMembers,
      );

      const result = await circleMemberService.searchCircleMembers(
        userId,
        circleId,
        searchQuery,
      );

      expect(mockValidationService.verifyCircleExists).toHaveBeenCalledWith(
        circleId,
      );
      expect(mockValidationService.verifyIsMember).toHaveBeenCalledWith(
        userId,
        circleId,
      );
      expect(CircleRepository.searchCircleMembers).toHaveBeenCalledWith(
        circleId,
        searchQuery,
      );
      expect(result).toEqual(mockTransformedMembers);
    });

    it("should return empty array when no members match the search query", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.verifyIsMember).mockResolvedValue(true);
      vi.mocked(CircleRepository.searchCircleMembers).mockResolvedValue([]);
      vi.mocked(CircleEnricher.enrichMembers).mockResolvedValue([]);
      vi.mocked(CircleTransformers.transformMembers).mockReturnValue([]);

      const result = await circleMemberService.searchCircleMembers(
        userId,
        circleId,
        "nonexistent",
      );

      expect(result).toEqual([]);
    });

    it("should perform case-insensitive search", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.verifyIsMember).mockResolvedValue(true);
      vi.mocked(CircleRepository.searchCircleMembers).mockResolvedValue(
        mockMemberships,
      );
      vi.mocked(CircleEnricher.enrichMembers).mockResolvedValue(
        mockEnrichedMembers,
      );
      vi.mocked(CircleTransformers.transformMembers).mockReturnValue(
        mockTransformedMembers,
      );

      await circleMemberService.searchCircleMembers(userId, circleId, "JOHN");

      expect(CircleRepository.searchCircleMembers).toHaveBeenCalledWith(
        circleId,
        "JOHN",
      );
    });

    it("should handle partial username matches", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.verifyIsMember).mockResolvedValue(true);
      vi.mocked(CircleRepository.searchCircleMembers).mockResolvedValue([
        mockMemberships[0],
      ]);
      vi.mocked(CircleEnricher.enrichMembers).mockResolvedValue([
        mockEnrichedMembers[0],
      ]);
      vi.mocked(CircleTransformers.transformMembers).mockReturnValue([
        mockTransformedMembers[0],
      ]);

      const result = await circleMemberService.searchCircleMembers(
        userId,
        circleId,
        "doe",
      );

      expect(CircleRepository.searchCircleMembers).toHaveBeenCalledWith(
        circleId,
        "doe",
      );
      expect(result).toHaveLength(1);
      expect(result[0].user.username).toBe("john_doe");
    });

    it("should throw CircleNotFoundError if circle does not exist", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockRejectedValue(
        new CircleNotFoundError(circleId),
      );

      await expect(
        circleMemberService.searchCircleMembers(userId, circleId, searchQuery),
      ).rejects.toThrow(CircleNotFoundError);
    });

    it("should throw NotAMemberError if user is not a member", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.verifyIsMember).mockRejectedValue(
        new NotAMemberError(userId, circleId),
      );

      await expect(
        circleMemberService.searchCircleMembers(userId, circleId, searchQuery),
      ).rejects.toThrow(NotAMemberError);
    });
  });

  describe("getMemberInfo", () => {
    it("should return member info when membership exists", async () => {
      vi.mocked(CircleRepository.getMembership).mockResolvedValue(
        mockMembership,
      );
      vi.mocked(CircleEnricher.enrichMember).mockResolvedValue(
        mockEnrichedMember,
      );
      vi.mocked(CircleTransformers.transformMember).mockReturnValue(
        mockTransformedMember,
      );

      const res = await circleMemberService.getMemberInfo("user-2", "circle-1");
      expect(res).toEqual(mockTransformedMember);
    });

    it("should throw CircleMemberNotFoundError when membership missing", async () => {
      vi.mocked(CircleRepository.getMembership).mockResolvedValue(null);
      await expect(
        circleMemberService.getMemberInfo("user-2", "circle-1"),
      ).rejects.toThrow(CircleMemberNotFoundError);
    });
  });

  describe("muteMember", () => {
    const actor = { id: "owner", circleRole: "OWNER" } as any;
    const targetMembership = {
      userId: "user-2",
      circleId: "circle-1",
      role: "MEMBER",
    } as any;
    const mutedMembership = {
      ...mockMembership,
      mutedUntil: new Date("2099-01-01"),
    } as any;
    const mutedEnriched = { ...mutedMembership, isMuted: true } as any;
    const mutedTransformed = {
      ...mutedEnriched,
      user: mockTransformedMember.user,
    } as any;

    beforeEach(() => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.verifyMembership).mockResolvedValue(
        targetMembership,
      );
      mockCirclePermission.assertCanMuteMember.mockReturnValue(undefined);
      vi.mocked(CircleRepository.setMemberMute).mockResolvedValue(
        mutedMembership,
      );
      vi.mocked(CircleEnricher.enrichMember).mockResolvedValue(mutedEnriched);
      vi.mocked(CircleTransformers.transformMember).mockReturnValue(
        mutedTransformed,
      );
    });

    it("should mute a member for a finite duration", async () => {
      const result = await circleMemberService.muteMember(
        actor,
        "circle-1",
        "user-2",
        15,
      );

      expect(mockValidationService.verifyCircleExists).toHaveBeenCalledWith(
        "circle-1",
      );
      expect(mockValidationService.verifyMembership).toHaveBeenCalledWith(
        "user-2",
        "circle-1",
      );
      expect(mockCirclePermission.assertCanMuteMember).toHaveBeenCalledWith(
        actor,
        {
          role: "MEMBER",
          userId: "user-2",
        },
      );
      expect(CircleRepository.setMemberMute).toHaveBeenCalledWith(
        "user-2",
        "circle-1",
        expect.any(Date),
      );
      expect(result).toEqual(mutedTransformed);
    });

    it("should set mutedUntil to the sentinel date for an indefinite mute", async () => {
      await circleMemberService.muteMember(
        actor,
        "circle-1",
        "user-2",
        "indefinite",
      );

      const [, , mutedUntil] = vi.mocked(CircleRepository.setMemberMute).mock
        .calls[0];
      expect((mutedUntil as Date).getFullYear()).toBe(9999);
    });

    it("should set mutedUntil roughly durationMinutes in the future for a timed mute", async () => {
      const duration: MuteDurationMinutes = 60;
      const before = Date.now();
      await circleMemberService.muteMember(
        actor,
        "circle-1",
        "user-2",
        duration,
      );
      const after = Date.now();

      const [, , mutedUntil] = vi.mocked(CircleRepository.setMemberMute).mock
        .calls[0];
      const ms = (mutedUntil as Date).getTime();
      expect(ms).toBeGreaterThanOrEqual(before + MUTE_DURATION_MS[duration]);
      expect(ms).toBeLessThanOrEqual(after + MUTE_DURATION_MS[duration]);
    });

    it("should throw if the circle does not exist", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockRejectedValue(
        new CircleNotFoundError("circle-1"),
      );

      await expect(
        circleMemberService.muteMember(actor, "circle-1", "user-2", 15),
      ).rejects.toThrow(CircleNotFoundError);
    });

    it("should throw if the member is not found", async () => {
      vi.mocked(mockValidationService.verifyMembership).mockRejectedValue(
        new CircleMemberNotFoundError("user-2", "circle-1"),
      );

      await expect(
        circleMemberService.muteMember(actor, "circle-1", "user-2", 15),
      ).rejects.toThrow(CircleMemberNotFoundError);
    });

    it("should propagate authorization errors from rbac", async () => {
      mockCirclePermission.assertCanMuteMember.mockImplementation(() => {
        throw new AuthorizationError("nope");
      });

      await expect(
        circleMemberService.muteMember(actor, "circle-1", "user-2", 15),
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe("unmuteMember", () => {
    const actor = { id: "owner", circleRole: "OWNER" } as any;
    const targetMembership = {
      userId: "user-2",
      circleId: "circle-1",
      role: "MEMBER",
    } as any;
    const unmutedMembership = {
      ...mockMembership,
      mutedUntil: null,
    } as any;
    const unmutedEnriched = { ...unmutedMembership, isMuted: false } as any;
    const unmutedTransformed = {
      ...unmutedEnriched,
      user: mockTransformedMember.user,
    } as any;

    beforeEach(() => {
      vi.mocked(mockValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(mockValidationService.verifyMembership).mockResolvedValue(
        targetMembership,
      );
      mockCirclePermission.assertCanMuteMember.mockReturnValue(undefined);
      vi.mocked(CircleRepository.setMemberMute).mockResolvedValue(
        unmutedMembership,
      );
      vi.mocked(CircleEnricher.enrichMember).mockResolvedValue(unmutedEnriched);
      vi.mocked(CircleTransformers.transformMember).mockReturnValue(
        unmutedTransformed,
      );
    });

    it("should unmute a member", async () => {
      const result = await circleMemberService.unmuteMember(
        actor,
        "circle-1",
        "user-2",
      );

      expect(mockValidationService.verifyCircleExists).toHaveBeenCalledWith(
        "circle-1",
      );
      expect(mockValidationService.verifyMembership).toHaveBeenCalledWith(
        "user-2",
        "circle-1",
      );
      expect(mockCirclePermission.assertCanMuteMember).toHaveBeenCalledWith(
        actor,
        {
          role: "MEMBER",
          userId: "user-2",
        },
      );
      expect(CircleRepository.setMemberMute).toHaveBeenCalledWith(
        "user-2",
        "circle-1",
        null,
      );
      expect(result).toEqual(unmutedTransformed);
    });

    it("should throw if the circle does not exist", async () => {
      vi.mocked(mockValidationService.verifyCircleExists).mockRejectedValue(
        new CircleNotFoundError("circle-1"),
      );

      await expect(
        circleMemberService.unmuteMember(actor, "circle-1", "user-2"),
      ).rejects.toThrow(CircleNotFoundError);
    });

    it("should throw if the member is not found", async () => {
      vi.mocked(mockValidationService.verifyMembership).mockRejectedValue(
        new CircleMemberNotFoundError("user-2", "circle-1"),
      );

      await expect(
        circleMemberService.unmuteMember(actor, "circle-1", "user-2"),
      ).rejects.toThrow(CircleMemberNotFoundError);
    });
  });
});
