import { describe, it, expect, vi, beforeEach } from "vitest";

// Capture the mocked logger instance so we can verify calls
const mockLoggerState = vi.hoisted(() => {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
});

vi.mock("../../../src/socket/circles/handlers/index.js", () => ({
  handleJoinCircle: vi.fn(() => vi.fn()),
  handleLeaveCircle: vi.fn(() => vi.fn()),
  handleDiscoveryWatch: vi.fn(() => vi.fn()),
  handleDiscoveryUnwatch: vi.fn(() => vi.fn()),
  handleDisconnect: vi.fn(() => vi.fn()),
}));

vi.mock("../../../src/core/config/logger.js", () => ({
  createLogger: vi.fn(() => mockLoggerState),
}));

import { registerCircleSocketHandlers } from "../../../src/socket/circles/circle.socket.js";

function makeSocket() {
  return {
    id: "socket1",
    data: { user: { id: "user1", username: "alice" } },
    on: vi.fn(),
  } as any;
}

function makeNamespace() {
  const listeners: Record<string, Function[]> = {};
  return {
    on: vi.fn((event: string, callback: Function) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(callback);
    }),
    // Helper to trigger connection event in test
    _triggerConnection(socket: any) {
      const callbacks = listeners["connection"];
      if (callbacks) {
        callbacks.forEach((cb) => cb(socket));
      }
    },
  } as any;
}

describe("registerCircleSocketHandlers integration", () => {
  let nsp: any;
  let socket: any;

  beforeEach(() => {
    nsp = makeNamespace();
    socket = makeSocket();
    vi.clearAllMocks();
  });

  it("registers all event handlers when called", () => {
    registerCircleSocketHandlers(nsp);

    // namespace should listen for connection
    expect(nsp.on).toHaveBeenCalledWith("connection", expect.any(Function));
  });

  it("wires up all socket events upon user connection", () => {
    registerCircleSocketHandlers(nsp);

    // Trigger connection with mocked socket
    nsp._triggerConnection(socket);

    // socket should register all five events
    expect(socket.on).toHaveBeenCalledWith(
      "circle:join_room",
      expect.any(Function),
    );
    expect(socket.on).toHaveBeenCalledWith(
      "circle:leave_room",
      expect.any(Function),
    );
    expect(socket.on).toHaveBeenCalledWith(
      "circle:watch_discovery",
      expect.any(Function),
    );
    expect(socket.on).toHaveBeenCalledWith(
      "circle:unwatch_discovery",
      expect.any(Function),
    );
    expect(socket.on).toHaveBeenCalledWith("disconnect", expect.any(Function));

    // Verify each was called exactly once
    expect(socket.on).toHaveBeenCalledTimes(5);
  });

  it("calls handler factories with socket and nsp arguments", async () => {
    const handlers =
      await import("../../../src/socket/circles/handlers/index.js");

    registerCircleSocketHandlers(nsp);
    nsp._triggerConnection(socket);

    // Handlers that take both socket and nsp
    expect(handlers.handleJoinCircle).toHaveBeenCalledWith(socket, nsp);
    expect(handlers.handleLeaveCircle).toHaveBeenCalledWith(socket, nsp);
    expect(handlers.handleDiscoveryWatch).toHaveBeenCalledWith(socket, nsp);
    expect(handlers.handleDisconnect).toHaveBeenCalledWith(socket, nsp);

    // Handler that only takes socket
    expect(handlers.handleDiscoveryUnwatch).toHaveBeenCalledWith(socket);
  });

  it("logs user connection with id, username, and socketId", () => {
    registerCircleSocketHandlers(nsp);
    nsp._triggerConnection(socket);

    expect(mockLoggerState.info).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user1",
        username: "alice",
        socketId: "socket1",
      }),
      expect.any(String),
    );
  });

  it("logs when handlers are registered", () => {
    registerCircleSocketHandlers(nsp);

    expect(mockLoggerState.info).toHaveBeenCalledWith(
      "Study circle socket handlers registered",
    );
  });

  it("does not throw when socket.data.user is present", () => {
    registerCircleSocketHandlers(nsp);

    expect(() => {
      nsp._triggerConnection(socket);
    }).not.toThrow();
  });
});
