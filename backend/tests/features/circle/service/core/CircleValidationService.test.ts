import { describe, it, expect, beforeEach, vi } from "vitest";
import { CircleValidationService } from "../../../../../src/features/circle/service/core/CircleValidationService.js";
import CircleRepository from "../../../../../src/features/circle/service/Repositories/CircleRepository.js";
import {
  CircleNotFoundError,
  CircleMemberNotFoundError,
  MessageNotFoundError,
  UserMutedError,
} from "../../../../../src/core/error/custom/circle.error.js";

vi.mock(
  "../../../../../src/features/circle/service/Repositories/CircleRepository.js",
);

describe("CircleValidationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("verifyCircleExists", () => {
    it("returns circle when found", async () => {
      const circle = { id: "c1" };
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(
        circle as any,
      );
      const res = await CircleValidationService.verifyCircleExists("c1");
      expect(res).toEqual(circle);
    });

    it("throws CircleNotFoundError when missing", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(null);
      await expect(
        CircleValidationService.verifyCircleExists("c1"),
      ).rejects.toThrow(CircleNotFoundError);
    });
  });

  describe("verifyMembership", () => {
    it("returns membership when exists", async () => {
      const membership = { userId: "u", circleId: "c1" };
      vi.mocked(CircleRepository.getMembership).mockResolvedValue(
        membership as any,
      );
      const res = await CircleValidationService.verifyMembership("u", "c1");
      expect(res).toEqual(membership);
    });

    it("throws CircleMemberNotFoundError when missing", async () => {
      vi.mocked(CircleRepository.getMembership).mockResolvedValue(null);
      await expect(
        CircleValidationService.verifyMembership("u", "c1"),
      ).rejects.toThrow(CircleMemberNotFoundError);
    });
  });

  describe("ensureMemberNotMuted", () => {
    it("does nothing when user not muted or mute expired", async () => {
      vi.mocked(CircleRepository.getMembership).mockResolvedValue({
        mutedUntil: null,
      } as any);
      await expect(
        CircleValidationService.ensureMemberNotMuted({
          senderId: "u",
          circleId: "c1",
          content: "hi",
        }),
      ).resolves.toBeUndefined();

      vi.mocked(CircleRepository.getMembership).mockResolvedValue({
        mutedUntil: new Date(Date.now() - 1000),
      } as any);
      await expect(
        CircleValidationService.ensureMemberNotMuted({
          senderId: "u",
          circleId: "c1",
          content: "hi",
        }),
      ).resolves.toBeUndefined();
    });

    it("throws UserMutedError when still muted", async () => {
      const future = new Date(Date.now() + 3600000);
      vi.mocked(CircleRepository.getMembership).mockResolvedValue({
        mutedUntil: future,
      } as any);
      await expect(
        CircleValidationService.ensureMemberNotMuted({
          senderId: "u",
          circleId: "c1",
          content: "hi",
        }),
      ).rejects.toThrow(UserMutedError);
    });
  });

  describe("verifyMessageExists", () => {
    it("returns message when found", async () => {
      const msg = { id: 5 };
      vi.mocked(CircleRepository.findMessageById).mockResolvedValue(msg as any);
      const res = await CircleValidationService.verifyMessageExists(5);
      expect(res).toEqual(msg);
    });

    it("throws MessageNotFoundError when missing", async () => {
      vi.mocked(CircleRepository.findMessageById).mockResolvedValue(null);
      await expect(
        CircleValidationService.verifyMessageExists(5),
      ).rejects.toThrow(MessageNotFoundError);
    });
  });

  describe("checkMembership", () => {
    it("returns true/false based on repository", async () => {
      vi.mocked(CircleRepository.isMember).mockResolvedValue(true);
      expect(await CircleValidationService.checkMembership("u", "c")).toBe(
        true,
      );
      vi.mocked(CircleRepository.isMember).mockResolvedValue(false);
      expect(await CircleValidationService.checkMembership("u", "c")).toBe(
        false,
      );
    });
  });
});
