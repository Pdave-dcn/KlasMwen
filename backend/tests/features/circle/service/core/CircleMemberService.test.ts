import { describe, it, expect, beforeEach, vi } from "vitest";
import { CircleMemberService } from "../../../../../src/features/circle/service/core/CircleMemberService.js";
import CircleRepository from "../../../../../src/features/circle/service/Repositories/CircleRepository.js";
import CircleEnricher from "../../../../../src/features/circle/service/CircleEnrichers.js";
import CircleTransformers from "../../../../../src/features/circle/service/CircleTransformers.js";
import { CircleValidationService } from "../../../../../src/features/circle/service/core/CircleValidationService.js";
import { assertCirclePermission } from "../../../../../src/features/circle/security/rbac.js";
import { AuthorizationError } from "../../../../../src/core/error/custom/auth.error.js";
import {
  CircleNotFoundError,
  AlreadyMemberError,
  CircleMemberNotFoundError,
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
      vi.mocked(CircleValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(CircleValidationService.verifyMembership).mockResolvedValue(
        targetMembership,
      );
      vi.mocked(assertCirclePermission).mockReturnValue(undefined);
      vi.mocked(CircleRepository.setMemberMute).mockResolvedValue(
        mutedMembership,
      );
      vi.mocked(CircleEnricher.enrichMember).mockResolvedValue(mutedEnriched);
      vi.mocked(CircleTransformers.transformMember).mockReturnValue(
        mutedTransformed,
      );
    });

    it("should mute a member for a finite duration", async () => {
      const result = await CircleMemberService.muteMember(
        actor,
        "circle-1",
        "user-2",
        15,
      );

      expect(CircleValidationService.verifyCircleExists).toHaveBeenCalledWith(
        "circle-1",
      );
      expect(CircleValidationService.verifyMembership).toHaveBeenCalledWith(
        "user-2",
        "circle-1",
      );
      expect(assertCirclePermission).toHaveBeenCalledWith(
        actor,
        "circleMembers",
        "mute",
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
      await CircleMemberService.muteMember(
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
      await CircleMemberService.muteMember(
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
      vi.mocked(CircleValidationService.verifyCircleExists).mockRejectedValue(
        new CircleNotFoundError("circle-1"),
      );

      await expect(
        CircleMemberService.muteMember(actor, "circle-1", "user-2", 15),
      ).rejects.toThrow(CircleNotFoundError);
    });

    it("should throw if the target is not a member", async () => {
      vi.mocked(CircleValidationService.verifyMembership).mockRejectedValue(
        new CircleMemberNotFoundError("user-2", "circle-1"),
      );

      await expect(
        CircleMemberService.muteMember(actor, "circle-1", "user-2", 15),
      ).rejects.toThrow(CircleMemberNotFoundError);
    });

    it("should propagate authorization errors from rbac", async () => {
      vi.mocked(assertCirclePermission).mockImplementation(() => {
        throw new AuthorizationError("insufficient role");
      });

      await expect(
        CircleMemberService.muteMember(
          { id: "mod", circleRole: "MODERATOR" } as any,
          "circle-1",
          "user-2",
          15,
        ),
      ).rejects.toThrow(AuthorizationError);

      expect(CircleRepository.setMemberMute).not.toHaveBeenCalled();
    });

    it("should pass target membership to assertCirclePermission for role-hierarchy checks", async () => {
      const modTarget = {
        userId: "mod-2",
        circleId: "circle-1",
        role: "MODERATOR",
      } as any;
      vi.mocked(CircleValidationService.verifyMembership).mockResolvedValue(
        modTarget,
      );

      await CircleMemberService.muteMember(actor, "circle-1", "mod-2", 30);

      expect(assertCirclePermission).toHaveBeenCalledWith(
        actor,
        "circleMembers",
        "mute",
        {
          role: "MODERATOR",
          userId: "mod-2",
        },
      );
    });

    it.each([15, 30, 60, 360, 1440] as MuteDurationMinutes[])(
      "should compute a future mutedUntil for duration %i minutes",
      async (duration) => {
        const before = Date.now();
        await CircleMemberService.muteMember(
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

        vi.mocked(CircleRepository.setMemberMute).mockClear();
      },
    );
  });

  describe("unmuteMember", () => {
    const actor = { id: "owner", circleRole: "OWNER" } as any;
    const targetMembership = {
      userId: "user-2",
      circleId: "circle-1",
      role: "MEMBER",
    } as any;
    const unmutedMembership = { ...mockMembership, mutedUntil: null } as any;
    const unmutedEnriched = { ...unmutedMembership, isMuted: false } as any;
    const unmutedTransformed = {
      ...unmutedEnriched,
      user: mockTransformedMember.user,
    } as any;

    beforeEach(() => {
      vi.mocked(CircleValidationService.verifyCircleExists).mockResolvedValue(
        mockCircle,
      );
      vi.mocked(CircleValidationService.verifyMembership).mockResolvedValue(
        targetMembership,
      );
      vi.mocked(assertCirclePermission).mockReturnValue(undefined);
      vi.mocked(CircleRepository.setMemberMute).mockResolvedValue(
        unmutedMembership,
      );
      vi.mocked(CircleEnricher.enrichMember).mockResolvedValue(unmutedEnriched);
      vi.mocked(CircleTransformers.transformMember).mockReturnValue(
        unmutedTransformed,
      );
    });

    it("should clear the mute by passing null to setMemberMute", async () => {
      const result = await CircleMemberService.unmuteMember(
        actor,
        "circle-1",
        "user-2",
      );

      expect(CircleValidationService.verifyCircleExists).toHaveBeenCalledWith(
        "circle-1",
      );
      expect(CircleValidationService.verifyMembership).toHaveBeenCalledWith(
        "user-2",
        "circle-1",
      );
      expect(assertCirclePermission).toHaveBeenCalledWith(
        actor,
        "circleMembers",
        "mute",
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
      vi.mocked(CircleValidationService.verifyCircleExists).mockRejectedValue(
        new CircleNotFoundError("circle-1"),
      );

      await expect(
        CircleMemberService.unmuteMember(actor, "circle-1", "user-2"),
      ).rejects.toThrow(CircleNotFoundError);
    });

    it("should throw if the target is not a member", async () => {
      vi.mocked(CircleValidationService.verifyMembership).mockRejectedValue(
        new CircleMemberNotFoundError("user-2", "circle-1"),
      );

      await expect(
        CircleMemberService.unmuteMember(actor, "circle-1", "user-2"),
      ).rejects.toThrow(CircleMemberNotFoundError);
    });

    it("should propagate authorization errors from rbac", async () => {
      vi.mocked(assertCirclePermission).mockImplementation(() => {
        throw new AuthorizationError("insufficient role");
      });

      await expect(
        CircleMemberService.unmuteMember(
          { id: "member", circleRole: "MEMBER" } as any,
          "circle-1",
          "user-2",
        ),
      ).rejects.toThrow(AuthorizationError);

      expect(CircleRepository.setMemberMute).not.toHaveBeenCalled();
    });

    it("should pass target membership to assertCirclePermission for role-hierarchy checks", async () => {
      const modTarget = {
        userId: "mod-2",
        circleId: "circle-1",
        role: "MODERATOR",
      } as any;
      vi.mocked(CircleValidationService.verifyMembership).mockResolvedValue(
        modTarget,
      );

      await CircleMemberService.unmuteMember(actor, "circle-1", "mod-2");

      expect(assertCirclePermission).toHaveBeenCalledWith(
        actor,
        "circleMembers",
        "mute",
        {
          role: "MODERATOR",
          userId: "mod-2",
        },
      );
    });
  });
});
