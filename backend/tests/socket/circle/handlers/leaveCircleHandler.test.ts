import { describe, it, expect, vi, beforeEach } from "vitest";

import { handleLeaveCircle } from "../../../../src/socket/circles/handlers/leaveCircleHandler.js";
import { broadcastPresenceUpdate } from "../../../../src/socket/circles/helpers/broadcastPresenceUpdate.js";

// mock logger to silence logs
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
    // leave should be awaited
    leave: vi.fn().mockResolvedValue(undefined),
    to: vi.fn().mockReturnValue({ emit: vi.fn() }),
    emit: vi.fn(),
  } as any;
}

function makeNamespace() {
  return {} as any;
}

describe("handleLeaveCircle handler", () => {
  let socket: any;
  let nsp: any;
  let callback: any;

  beforeEach(() => {
    socket = makeSocket();
    nsp = makeNamespace();
    callback = vi.fn();
    vi.clearAllMocks();
  });

  it("successfully leaves a circle and notifies others", async () => {
    const circleId = "123e4567-e89b-12d3-a456-426614174000";

    // user has this circle in their set
    socket.data.joinedStudyCircles = new Set([circleId]);

    const handler = handleLeaveCircle(socket, nsp);

    await handler({ circleId }, callback);

    // socket.leave called with prefixed room
    expect(socket.leave).toHaveBeenCalledWith(`circle:${circleId}`);

    // circle removed from set
    expect(socket.data.joinedStudyCircles.has(circleId)).toBe(false);

    // presence update triggered
    expect(broadcastPresenceUpdate).toHaveBeenCalledTimes(1);
    expect(broadcastPresenceUpdate).toHaveBeenCalledWith(circleId, nsp);

    // notify room members (socket.to omits sender)
    expect(socket.to).toHaveBeenCalledWith(`circle:${circleId}`);
    expect(socket.to(`circle:${circleId}`).emit).toHaveBeenCalledWith(
      "circle:member_left",
      { user: { id: "user1", username: "alice" } },
    );

    // callback reports success
    expect(callback).toHaveBeenCalledWith({ success: true });
  });

  it("handles missing joinedStudyCircles gracefully", async () => {
    const circleId = "123e4567-e89b-12d3-a456-426614174001";

    // no joinedStudyCircles set
    delete socket.data.joinedStudyCircles;

    const handler = handleLeaveCircle(socket, nsp);

    await handler({ circleId }, callback);

    // still attempts to leave and notify
    expect(socket.leave).toHaveBeenCalledWith(`circle:${circleId}`);
    expect(broadcastPresenceUpdate).toHaveBeenCalledWith(circleId, nsp);
    expect(socket.to(`circle:${circleId}`).emit).toHaveBeenCalledWith(
      "circle:member_left",
      { user: { id: "user1", username: "alice" } },
    );

    expect(callback).toHaveBeenCalledWith({ success: true });

    // empty set also safe
    vi.clearAllMocks();
    socket.data.joinedStudyCircles = new Set();
    await handler({ circleId }, callback);
    expect(socket.leave).toHaveBeenCalled();
    expect(broadcastPresenceUpdate).toHaveBeenCalled();
  });

  it("returns failure when socket.leave throws", async () => {
    const circleId = "123e4567-e89b-12d3-a456-426614174002";

    socket.data.joinedStudyCircles = new Set([circleId]);
    (socket.leave as any).mockRejectedValue(new Error("leave failed"));

    const handler = handleLeaveCircle(socket, nsp);
    await handler({ circleId }, callback);

    // on error, nothing further should run
    expect(socket.to).not.toHaveBeenCalled();
    expect(broadcastPresenceUpdate).not.toHaveBeenCalled();

    expect(callback).toHaveBeenCalledWith({ success: false });
  });

  it("returns failure on invalid circleId payload", async () => {
    const handler = handleLeaveCircle(socket, nsp);

    // pass invalid payload so zod throws
    await handler({ circleId: "bad-id" as any }, callback);

    expect(callback).toHaveBeenCalledWith({ success: false });
    expect(socket.leave).not.toHaveBeenCalled();
    expect(socket.to).not.toHaveBeenCalled();
  });
});
