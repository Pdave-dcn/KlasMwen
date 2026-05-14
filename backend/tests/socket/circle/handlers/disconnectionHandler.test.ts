import { describe, it, expect, vi, beforeEach } from "vitest";

import { handleDisconnect } from "../../../../src/socket/circles/handlers/disconnectionHandler.js";
import { broadcastPresenceUpdate } from "../../../../src/socket/circles/helpers/broadcastPresenceUpdate.js";

vi.mock("../../../../src/core/config/logger.js", () => ({
  createLogger: vi.fn(() => ({
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}));

vi.mock(
  "../../../../src/socket/circles/helpers/broadcastPresenceUpdate.js",
  () => ({
    broadcastPresenceUpdate: vi.fn(),
  }),
);

function makeSocket() {
  return {
    id: "socket1",
    data: { user: { id: "user1", username: "alice" } },
    to: vi.fn().mockReturnValue({ emit: vi.fn() }),
  } as any;
}

function makeNamespace() {
  // namespace is only forwarded to broadcastPresenceUpdate
  return {} as any;
}

describe("handleDisconnect socket handler", () => {
  let socket: any;
  let nsp: any;

  beforeEach(() => {
    socket = makeSocket();
    nsp = makeNamespace();
    vi.clearAllMocks();
  });

  it("cleans up multiple joined circles and broadcasts left events", () => {
    socket.data.joinedStudyCircles = new Set(["circle-1", "circle-2"]);

    const handler = handleDisconnect(socket, nsp);
    handler();

    // each room should have been targeted
    expect(socket.to).toHaveBeenCalledWith("circle:circle-1");
    expect(socket.to).toHaveBeenCalledWith("circle:circle-2");

    // payload includes user id and username
    expect(socket.to("circle:circle-1").emit).toHaveBeenCalledWith(
      "circle:member_left",
      { user: { id: "user1", username: "alice" } },
    );
    expect(socket.to("circle:circle-2").emit).toHaveBeenCalledWith(
      "circle:member_left",
      { user: { id: "user1", username: "alice" } },
    );

    // broadcastPresenceUpdate invoked once per room
    expect(broadcastPresenceUpdate).toHaveBeenCalledTimes(2);
    expect(broadcastPresenceUpdate).toHaveBeenCalledWith("circle-1", nsp);
    expect(broadcastPresenceUpdate).toHaveBeenCalledWith("circle-2", nsp);
  });

  it("does nothing when there are no joined circles", () => {
    // no set at all
    const handler = handleDisconnect(socket, nsp);
    expect(() => handler()).not.toThrow();

    expect(socket.to).not.toHaveBeenCalled();
    expect(broadcastPresenceUpdate).not.toHaveBeenCalled();

    // empty set case as well
    socket.data.joinedStudyCircles = new Set();
    handler();
    expect(socket.to).not.toHaveBeenCalled();
    expect(broadcastPresenceUpdate).not.toHaveBeenCalled();
  });
});
