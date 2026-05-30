import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationEmitter } from "../../../src/features/notification/service/core/NotificationEmitter.js";

describe("NotificationEmitter", () => {
  let emitter: NotificationEmitter;

  beforeEach(() => {
    emitter = new NotificationEmitter();
  });

  describe("before initialization", () => {
    it("should not throw when emit is called before io is initialized", () => {
      expect(() => {
        emitter.emit("user-1", "notification:new", { id: 1 });
      }).not.toThrow();
    });

    it("should report isReady as false", () => {
      expect(emitter.isReady).toBe(false);
    });
  });

  describe("after initialization", () => {
    it("should emit to the correct user room", () => {
      const mockTo = vi.fn().mockReturnValue({ emit: vi.fn() });
      const mockIo = { to: mockTo } as any;

      emitter.initialize(mockIo);

      emitter.emit("user-1", "notification:new", { id: 1, type: "LIKE" });

      expect(mockTo).toHaveBeenCalledWith(["user:user-1"]);
    });

    it("should pass the correct event name and payload", () => {
      const mockEmit = vi.fn();
      const mockIo = {
        to: vi.fn().mockReturnValue({ emit: mockEmit }),
      } as any;

      emitter.initialize(mockIo);

      const payload = { id: 42, type: "LIKE", userId: "user-1" };
      emitter.emit("user-1", "notification:new", payload);

      expect(mockEmit).toHaveBeenCalledWith("notification:new", payload);
    });

    it("should support multiple emits", () => {
      const mockEmit = vi.fn();
      const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });
      const mockIo = { to: mockTo } as any;

      emitter.initialize(mockIo);
      emitter.emit("user-1", "notification:new", { id: 1 });
      emitter.emit("user-2", "notification:new", { id: 2 });
      emitter.emit("user-1", "notification:new", { id: 3 });

      expect(mockTo).toHaveBeenCalledTimes(3);
      expect(mockTo).toHaveBeenNthCalledWith(1, ["user:user-1"]);
      expect(mockTo).toHaveBeenNthCalledWith(2, ["user:user-2"]);
      expect(mockTo).toHaveBeenNthCalledWith(3, ["user:user-1"]);
    });

    it("should report isReady as true after initialization", () => {
      const mockIo = { to: vi.fn() } as any;
      emitter.initialize(mockIo);

      expect(emitter.isReady).toBe(true);
    });
  });

  describe("initialization", () => {
    it("should work correctly when initialized once", () => {
      const mockEmit = vi.fn();
      const mockIo = { to: vi.fn().mockReturnValue({ emit: mockEmit }) } as any;

      emitter.initialize(mockIo);
      emitter.emit("user-1", "test", { id: 1 });

      expect(mockIo.to).toHaveBeenCalled();
      expect(mockEmit).toHaveBeenCalledWith("test", { id: 1 });
    });
  });
});
