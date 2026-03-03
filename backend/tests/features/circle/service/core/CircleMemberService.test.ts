import { describe, it, expect, beforeEach, vi } from "vitest";
import { CircleMemberService } from "../../../../../src/features/circle/service/core/CircleMemberService.js";
import CircleRepository from "../../../../../src/features/circle/service/Repositories/CircleRepository.js";
import CircleEnricher from "../../../../../src/features/circle/service/CircleEnrichers.js";
import CircleTransformers from "../../../../../src/features/circle/service/CircleTransformers.js";
import { assertCirclePermission } from "../../../../../src/features/circle/security/rbac.js";
import { AuthorizationError } from "../../../../../src/core/error/custom/auth.error.js";
import {
  CircleNotFoundError,
  AlreadyMemberError,
  CircleMemberNotFoundError,
} from "../../../../../src/core/error/custom/circle.error.js";

vi.mock(
  "../../../../../src/features/circle/service/Repositories/CircleRepository.js",
);
vi.mock("../../../../../src/features/circle/service/CircleEnrichers.js");
vi.mock("../../../../../src/features/circle/service/CircleTransformers.js");
vi.mock("../../../../../src/features/circle/security/rbac.js");

describe("CircleMemberService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(mockCircle);
      vi.mocked(CircleRepository.isMember).mockResolvedValue(false);
      vi.mocked(CircleRepository.addMember).mockResolvedValue(mockMembership);
      vi.mocked(CircleEnricher.enrichMember).mockResolvedValue(
        mockEnrichedMember,
      );
      vi.mocked(CircleTransformers.transformMember).mockReturnValue(
        mockTransformedMember,
      );

      const data = { userId: "user-2", circleId: "circle-1" };
      const result = await CircleMemberService.addMember(data);

      expect(CircleRepository.findCircleById).toHaveBeenCalledWith("circle-1");
      expect(CircleRepository.isMember).toHaveBeenCalledWith(
        "user-2",
        "circle-1",
      );
      expect(CircleRepository.addMember).toHaveBeenCalledWith(data);
      expect(result).toEqual(mockTransformedMember);
    });

    it("should throw CircleNotFoundError when circle does not exist", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(null);
      await expect(
        CircleMemberService.addMember({ userId: "u", circleId: "c" }),
      ).rejects.toThrow(CircleNotFoundError);
    });

    it("should throw AlreadyMemberError if user is already a member", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(mockCircle);
      vi.mocked(CircleRepository.isMember).mockResolvedValue(true);

      await expect(
        CircleMemberService.addMember({ userId: "u", circleId: "c" }),
      ).rejects.toThrow(AlreadyMemberError);
    });

    it("should invoke permission check when requester adds someone else", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(mockCircle);
      vi.mocked(CircleRepository.isMember).mockResolvedValue(false);
      vi.mocked(CircleRepository.addMember).mockResolvedValue(mockMembership);
      vi.mocked(CircleEnricher.enrichMember).mockResolvedValue(
        mockEnrichedMember,
      );
      vi.mocked(CircleTransformers.transformMember).mockReturnValue(
        mockTransformedMember,
      );

      const requester = { id: "admin", circleRole: "OWNER" } as any;
      await CircleMemberService.addMember(
        { userId: "user-2", circleId: "circle-1" },
        requester,
      );

      expect(assertCirclePermission).toHaveBeenCalledWith(
        requester,
        "circleMembers",
        "add",
      );
    });

    it("should propagate authorization errors from rbac", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(mockCircle);
      vi.mocked(CircleRepository.isMember).mockResolvedValue(false);
      vi.mocked(assertCirclePermission).mockImplementation(() => {
        throw new AuthorizationError("nope");
      });

      await expect(
        CircleMemberService.addMember(
          { userId: "user-2", circleId: "circle-1" },
          { id: "admin" } as any,
        ),
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe("removeMember", () => {
    it("should remove a member and return transformed result", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(mockCircle);
      vi.mocked(CircleRepository.getMembership).mockResolvedValue(
        mockMembership,
      );
      vi.mocked(assertCirclePermission).mockReturnValue(undefined);
      vi.mocked(CircleRepository.removeMember).mockResolvedValue(
        mockMembership,
      );
      vi.mocked(CircleEnricher.enrichMember).mockResolvedValue(
        mockEnrichedMember,
      );
      vi.mocked(CircleTransformers.transformMember).mockReturnValue(
        mockTransformedMember,
      );

      const result = await CircleMemberService.removeMember(
        "user-2",
        "circle-1",
        { id: "user-2" } as any,
      );

      expect(CircleRepository.getMembership).toHaveBeenCalledWith(
        "user-2",
        "circle-1",
      );
      expect(assertCirclePermission).toHaveBeenCalled();
      expect(result).toEqual(mockTransformedMember);
    });

    it("should throw CircleNotFoundError if circle doesn\'t exist", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(null);
      await expect(
        CircleMemberService.removeMember("u", "c", { id: "u" } as any),
      ).rejects.toThrow(CircleNotFoundError);
    });

    it("should throw CircleMemberNotFoundError when membership missing", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(mockCircle);
      vi.mocked(CircleRepository.getMembership).mockResolvedValue(null);
      await expect(
        CircleMemberService.removeMember("u", "c", { id: "u" } as any),
      ).rejects.toThrow(CircleMemberNotFoundError);
    });

    it("should propagate authorization errors from rbac", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(mockCircle);
      vi.mocked(CircleRepository.getMembership).mockResolvedValue(
        mockMembership,
      );
      vi.mocked(assertCirclePermission).mockImplementation(() => {
        throw new AuthorizationError("nope");
      });

      await expect(
        CircleMemberService.removeMember("user-2", "circle-1", {
          id: "foo",
        } as any),
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe("updateMemberRole", () => {
    it("should update a member's role when authorized", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(mockCircle);
      vi.mocked(CircleRepository.getMembership).mockResolvedValue(
        mockMembership,
      );
      vi.mocked(assertCirclePermission).mockReturnValue(undefined);
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
      const result = await CircleMemberService.updateMemberRole(
        "user-2",
        "circle-1",
        { role: "MODERATOR" as const },
        requester,
      );

      expect(assertCirclePermission).toHaveBeenCalledWith(
        requester,
        "circleMembers",
        "updateRole",
        mockMembership,
      );
      expect(result).toEqual(mockTransformedMember);
    });

    it("should throw CircleMemberNotFoundError when membership missing", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(mockCircle);
      vi.mocked(CircleRepository.getMembership).mockResolvedValue(null);

      await expect(
        CircleMemberService.updateMemberRole(
          "user-2",
          "circle-1",
          { role: "MODERATOR" as const },
          { id: "owner" } as any,
        ),
      ).rejects.toThrow(CircleMemberNotFoundError);
    });

    it("should propagate authorization errors", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(mockCircle);
      vi.mocked(CircleRepository.getMembership).mockResolvedValue(
        mockMembership,
      );
      vi.mocked(assertCirclePermission).mockImplementation(() => {
        throw new AuthorizationError("nope");
      });

      await expect(
        CircleMemberService.updateMemberRole(
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
      vi.mocked(CircleRepository.getMembership).mockResolvedValue(
        mockMembership,
      );
      const spy = vi.spyOn(CircleRepository, "updateLastReadAt");

      await CircleMemberService.updateLastReadAt("user-2", "circle-1");
      expect(spy).toHaveBeenCalledWith("user-2", "circle-1");
    });

    it("should throw CircleMemberNotFoundError when membership missing", async () => {
      vi.mocked(CircleRepository.getMembership).mockResolvedValue(null);
      await expect(
        CircleMemberService.updateLastReadAt("user-2", "circle-1"),
      ).rejects.toThrow(CircleMemberNotFoundError);
    });
  });

  describe("getCircleMembers", () => {
    it("should return transformed members when circle exists", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(mockCircle);
      vi.mocked(CircleRepository.getGroupMembers).mockResolvedValue([
        mockMembership,
      ]);
      vi.mocked(CircleEnricher.enrichMembers).mockResolvedValue([
        mockEnrichedMember,
      ]);
      vi.mocked(CircleTransformers.transformMembers).mockReturnValue([
        mockTransformedMember,
      ]);

      const res = await CircleMemberService.getCircleMembers("circle-1");
      expect(res).toEqual([mockTransformedMember]);
    });

    it("should throw CircleNotFoundError if circle does not exist", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(null);
      await expect(
        CircleMemberService.getCircleMembers("circle-1"),
      ).rejects.toThrow(CircleNotFoundError);
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

      const res = await CircleMemberService.getMemberInfo("user-2", "circle-1");
      expect(res).toEqual(mockTransformedMember);
    });

    it("should throw CircleMemberNotFoundError when membership missing", async () => {
      vi.mocked(CircleRepository.getMembership).mockResolvedValue(null);
      await expect(
        CircleMemberService.getMemberInfo("user-2", "circle-1"),
      ).rejects.toThrow(CircleMemberNotFoundError);
    });
  });

  describe("isMember", () => {
    it("should return true when repository says so", async () => {
      vi.mocked(CircleRepository.isMember).mockResolvedValue(true);
      expect(await CircleMemberService.isMember("u", "c")).toBe(true);
    });

    it("should return false when repository says false", async () => {
      vi.mocked(CircleRepository.isMember).mockResolvedValue(false);
      expect(await CircleMemberService.isMember("u", "c")).toBe(false);
    });
  });
});
