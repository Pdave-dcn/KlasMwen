import { describe, it, expect, beforeEach, vi } from "vitest";
import { CircleMessageService } from "../../../../../src/features/circle/service/core/CircleMessageService.js";
import CircleRepository from "../../../../../src/features/circle/service/Repositories/CircleRepository.js";
import CircleTransformers from "../../../../../src/features/circle/service/CircleTransformers.js";
import { assertCirclePermission } from "../../../../../src/features/circle/security/rbac.js";
import { AuthorizationError } from "../../../../../src/core/error/custom/auth.error.js";
import {
  CircleNotFoundError,
  MessageNotFoundError,
  UserMutedError,
} from "../../../../../src/core/error/custom/circle.error.js";
import { CircleValidationService } from "../../../../../src/features/circle/service/core/CircleValidationService.js";

vi.mock(
  "../../../../../src/features/circle/service/Repositories/CircleRepository.js",
);
vi.mock("../../../../../src/features/circle/service/CircleTransformers.js");
vi.mock("../../../../../src/features/circle/security/rbac.js");
vi.mock(
  "../../../../../src/features/circle/service/core/CircleValidationService.js",
);

// helpers
const makeMessage = () => ({
  id: 1,
  content: "hello",
  circleId: "circle-1",
  senderId: "user-1",
  createdAt: new Date(),
});

const makeTransformed = () => ({
  id: 1,
  content: "hello",
  circleId: "circle-1",
  senderId: "user-1",
  createdAt: new Date().toISOString(),
});

describe("CircleMessageService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendMessage", () => {
    it("should send message when circle exists and user allowed", async () => {
      const data = { content: "hi", circleId: "circle-1", senderId: "user-1" };
      const circle = { id: "circle-1" };
      const msg = makeMessage();
      const transformed = makeTransformed();

      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(
        circle as any,
      );
      vi.mocked(assertCirclePermission).mockReturnValue(undefined);
      vi.mocked(CircleValidationService.ensureMemberNotMuted).mockResolvedValue(
        undefined,
      );
      vi.mocked(CircleRepository.createMessage).mockResolvedValue(msg as any);
      vi.mocked(CircleTransformers.transformMessage).mockReturnValue(
        transformed as any,
      );

      const result = await CircleMessageService.sendMessage(data, {
        id: "user-1",
      } as any);

      expect(CircleRepository.findCircleById).toHaveBeenCalledWith("circle-1");
      expect(assertCirclePermission).toHaveBeenCalledWith(
        { id: "user-1" },
        "circleMessages",
        "send",
      );
      expect(CircleValidationService.ensureMemberNotMuted).toHaveBeenCalledWith(
        data,
      );
      expect(CircleRepository.createMessage).toHaveBeenCalledWith(data);
      expect(result).toEqual(transformed);
    });

    it("should throw CircleNotFoundError when circle missing", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(null);
      await expect(
        CircleMessageService.sendMessage(
          { content: "", circleId: "c", senderId: "s" },
          { id: "s" } as any,
        ),
      ).rejects.toThrow(CircleNotFoundError);
    });

    it("should propagate AuthorizationError", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue({
        id: "c",
      } as any);
      vi.mocked(assertCirclePermission).mockImplementation(() => {
        throw new AuthorizationError("nope");
      });

      await expect(
        CircleMessageService.sendMessage(
          { content: "", circleId: "c", senderId: "s" },
          { id: "s" } as any,
        ),
      ).rejects.toThrow(AuthorizationError);
    });

    it("should propagate UserMutedError from validation", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue({
        id: "c",
      } as any);
      vi.mocked(assertCirclePermission).mockReturnValue(undefined);
      vi.mocked(CircleValidationService.ensureMemberNotMuted).mockRejectedValue(
        new UserMutedError("u", "c", new Date()),
      );

      await expect(
        CircleMessageService.sendMessage(
          { content: "", circleId: "c", senderId: "s" },
          { id: "s" } as any,
        ),
      ).rejects.toThrow(UserMutedError);
    });
  });

  describe("getMessages", () => {
    it("should return paginated results", async () => {
      const circle = { id: "c" };
      const msg = makeMessage();
      const transformed = makeTransformed();
      const pagination = { limit: 1 }; // small limit

      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(
        circle as any,
      );
      vi.mocked(assertCirclePermission).mockReturnValue(undefined);
      vi.mocked(CircleRepository.getMessages).mockResolvedValue([msg as any]);
      vi.mocked(CircleTransformers.transformMessages).mockReturnValue([
        transformed as any,
      ]);

      const result = await CircleMessageService.getMessages(
        "c",
        { id: "u" } as any,
        pagination,
      );
      expect(result.data).toEqual([transformed]);
      expect(result.pagination.hasMore).toBe(false);
    });

    it("should throw CircleNotFoundError when missing", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue(null);
      await expect(
        CircleMessageService.getMessages("c", { id: "u" } as any),
      ).rejects.toThrow(CircleNotFoundError);
    });

    it("should propagate AuthorizationError on read", async () => {
      vi.mocked(CircleRepository.findCircleById).mockResolvedValue({
        id: "c",
      } as any);
      vi.mocked(assertCirclePermission).mockImplementation(() => {
        throw new AuthorizationError("nope");
      });

      await expect(
        CircleMessageService.getMessages("c", { id: "u" } as any),
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe("getMessageById", () => {
    it("should return transformed message when exists", async () => {
      const msg = makeMessage();
      const transformed = makeTransformed();
      vi.mocked(CircleRepository.findMessageById).mockResolvedValue(msg as any);
      vi.mocked(CircleTransformers.transformMessage).mockReturnValue(
        transformed as any,
      );

      const res = await CircleMessageService.getMessageById(1);
      expect(res).toEqual(transformed);
    });

    it("should throw MessageNotFoundError when missing", async () => {
      vi.mocked(CircleRepository.findMessageById).mockResolvedValue(null);
      await expect(CircleMessageService.getMessageById(1)).rejects.toThrow(
        MessageNotFoundError,
      );
    });
  });

  describe("deleteMessage", () => {
    it("should delete and return transformed message when allowed", async () => {
      const msg = makeMessage();
      const transformed = makeTransformed();
      vi.mocked(CircleRepository.findMessageById).mockResolvedValue(msg as any);
      vi.mocked(assertCirclePermission).mockReturnValue(undefined);
      vi.mocked(CircleRepository.deleteMessage).mockResolvedValue(msg as any);
      vi.mocked(CircleTransformers.transformMessage).mockReturnValue(
        transformed as any,
      );

      const res = await CircleMessageService.deleteMessage(1, {
        id: "u",
      } as any);
      expect(res).toEqual(transformed);
    });

    it("should throw MessageNotFoundError when missing", async () => {
      vi.mocked(CircleRepository.findMessageById).mockResolvedValue(null);
      await expect(
        CircleMessageService.deleteMessage(1, { id: "u" } as any),
      ).rejects.toThrow(MessageNotFoundError);
    });

    it("should propagate AuthorizationError on delete", async () => {
      vi.mocked(CircleRepository.findMessageById).mockResolvedValue(
        makeMessage() as any,
      );
      vi.mocked(assertCirclePermission).mockImplementation(() => {
        throw new AuthorizationError("nope");
      });

      await expect(
        CircleMessageService.deleteMessage(1, { id: "u" } as any),
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe("getLatestMessage", () => {
    it("should return transformed message when exists", async () => {
      const msg = makeMessage();
      const transformed = makeTransformed();
      vi.mocked(CircleRepository.getLatestMessage).mockResolvedValue(
        msg as any,
      );
      vi.mocked(CircleTransformers.transformMessage).mockReturnValue(
        transformed as any,
      );

      const res = await CircleMessageService.getLatestMessage("c");
      expect(res).toEqual(transformed);
    });

    it("should return null when none exists", async () => {
      vi.mocked(CircleRepository.getLatestMessage).mockResolvedValue(null);
      const res = await CircleMessageService.getLatestMessage("c");
      expect(res).toBeNull();
    });
  });
});
