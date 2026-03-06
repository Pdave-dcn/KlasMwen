import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mutable refs so vi.mock factories can close over them
const socketListeners: Record<string, Function> = {};

const socketMock = {
  on: vi.fn((event: string, cb: Function) => {
    socketListeners[event] = cb;
  }),
  emit: vi.fn((_event: string, _payload?: any, cb?: Function) => {
    if (typeof cb === "function") {
      Promise.resolve().then(() =>
        cb({
          success: true,
          onlineMemberIds: ["u1"],
          presentMemberIds: ["u2"],
        }),
      );
    }
  }),
  disconnect: vi.fn(),
  __trigger(event: string, ...args: any[]) {
    const cb = socketListeners[event];
    if (cb) return cb(...args);
  },
};

const storeMock = {
  setOnlineMembers: vi.fn(),
  setPresentMembers: vi.fn(),
};

// These must be at top level — vi.mock is hoisted above imports
vi.mock("socket.io-client", () => ({
  io: vi.fn(() => socketMock),
}));

vi.mock("@/stores/circle.store", () => ({
  useCircleStore: {
    getState: () => storeMock,
  },
}));

describe("CircleSocketService singleton", () => {
  beforeEach(() => {
    // Reset all mocks and listener state between tests
    vi.resetModules();
    vi.clearAllMocks();
    // Clear listener registry
    Object.keys(socketListeners).forEach((k) => delete socketListeners[k]);
    // Re-wire socket.on to repopulate listeners after clearAllMocks
    socketMock.on.mockImplementation((event: string, cb: Function) => {
      socketListeners[event] = cb;
    });
    // Re-wire emit to call callback with success data
    socketMock.emit.mockImplementation(
      (_event: string, _payload?: any, cb?: Function) => {
        if (typeof cb === "function") {
          Promise.resolve().then(() =>
            cb({
              success: true,
              onlineMemberIds: ["u1"],
              presentMemberIds: ["u2"],
            }),
          );
        }
      },
    );
  });

  it("connect() initializes socket and registers handlers, and onConnect triggers handlers", async () => {
    const { circleSocketService } =
      await import("@/features/study-circles/services/socketService.ts");

    const handler = vi.fn();
    const unsubscribe = circleSocketService.onConnect(handler);

    circleSocketService.connect();

    const { io } = await import("socket.io-client");
    expect(io).toHaveBeenCalled();

    socketMock.__trigger("connect");
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();
    socketMock.__trigger("connect");
    expect(handler).toHaveBeenCalledTimes(1);

    circleSocketService.disconnect();
    expect(socketMock.disconnect).toHaveBeenCalled();
  });

  it("auto-joins currentCircleId on reconnect", async () => {
    const { circleSocketService } =
      await import("@/features/study-circles/services/socketService.ts");

    (circleSocketService as any).currentCircleId = "circle-abc";

    circleSocketService.connect();
    socketMock.__trigger("connect");

    const joinCall = socketMock.emit.mock.calls.find(
      (c: any[]) => c[0] === "circle:join_room",
    );
    expect(joinCall).toBeTruthy();
    expect(joinCall![1]).toEqual({ circleId: "circle-abc" });
  });

  it("updates zustand store when join callback returns data", async () => {
    const { circleSocketService } =
      await import("@/features/study-circles/services/socketService.ts");

    circleSocketService.connect();
    socketMock.__trigger("connect");

    circleSocketService.joinCircle("circle-xyz");

    await Promise.resolve();

    expect(storeMock.setOnlineMembers).toHaveBeenCalledWith(["u1"]);
    expect(storeMock.setPresentMembers).toHaveBeenCalledWith(["u2"]);
  });

  it("routes events and allows unsubscribe for onMessage/onMemberJoined/onMemberLeft", async () => {
    const { circleSocketService } =
      await import("@/features/study-circles/services/socketService.ts");

    const joinHandler = vi.fn();
    const unsubJoin = circleSocketService.onMemberJoined(joinHandler);
    (circleSocketService as any).memberJoinedHandlers.forEach((h: any) =>
      h({ user: { id: "u" } }),
    );
    expect(joinHandler).toHaveBeenCalledTimes(1);
    unsubJoin();
    (circleSocketService as any).memberJoinedHandlers.forEach((h: any) =>
      h({ user: { id: "u" } }),
    );
    expect(joinHandler).toHaveBeenCalledTimes(1);

    const leftHandler = vi.fn();
    const unsubLeft = circleSocketService.onMemberLeft(leftHandler);
    (circleSocketService as any).memberLeftHandlers.forEach((h: any) =>
      h({ user: { id: "u" } }),
    );
    expect(leftHandler).toHaveBeenCalledTimes(1);
    unsubLeft();
    (circleSocketService as any).memberLeftHandlers.forEach((h: any) =>
      h({ user: { id: "u" } }),
    );
    expect(leftHandler).toHaveBeenCalledTimes(1);
  });

  it("startDiscoveryWatch and stopDiscoveryWatch emit correct events", async () => {
    const { circleSocketService } =
      await import("@/features/study-circles/services/socketService.ts");

    circleSocketService.connect();
    socketMock.__trigger("connect");

    circleSocketService.startDiscoveryWatch(["a", "b"]);
    expect(socketMock.emit).toHaveBeenCalledWith("circle:watch_discovery", {
      circleIds: ["a", "b"],
    });

    circleSocketService.stopDiscoveryWatch(["a"]);
    expect(socketMock.emit).toHaveBeenCalledWith("circle:unwatch_discovery", {
      circleIds: ["a"],
    });
  });
});
