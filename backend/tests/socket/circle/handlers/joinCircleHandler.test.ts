import { describe, it, expect, vi, beforeEach } from "vitest";

import { handleJoinCircle } from "../../../../src/socket/circles/handlers/joinCircleHandler.js";
import CircleService from "../../../../src/features/circle/service/CircleService.js";
import { PresenceService } from "../../../../src/socket/presence/presence.service.js";
import { broadcastPresenceUpdate } from "../../../../src/socket/circles/helpers/broadcastPresenceUpdate.js";
import {
  CircleNotFoundError,
  NotAMemberError,
} from "../../../../src/core/error/custom/circle.error.js";

vi.mock("../../../../src/features/circle/service/CircleService.js", () => ({
  default: {
    verifyCircleExists: vi.fn(),
    isMember: vi.fn(),
    getCircleMemberIds: vi.fn(),
  },
}));

vi.mock("../../../../src/socket/presence/presence.service.js", () => ({
  PresenceService: {
    isOnline: vi.fn(),
  },
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
    join: vi.fn(),
    emit: vi.fn(),
    to: vi.fn().mockReturnValue({ emit: vi.fn() }),
  } as any;
}

function makeNamespace() {
  return {
    in: vi.fn().mockReturnValue({
      fetchSockets: vi.fn(),
    }),
    to: vi.fn().mockReturnValue({ emit: vi.fn() }),
  } as any;
}

describe("handleJoinCircle socket handler", () => {
  let socket: any;
  let nsp: any;
  let callback: any;

  beforeEach(() => {
    socket = makeSocket();
    nsp = makeNamespace();
    callback = vi.fn();
    vi.clearAllMocks();
  });

  describe("success path", () => {
    it("allows a valid member to join and returns presence lists", async () => {
      const circleId = "123e4567-e89b-12d3-a456-426614174000";

      (CircleService.verifyCircleExists as any).mockResolvedValue(undefined);
      (CircleService.isMember as any).mockResolvedValue(true);
      (CircleService.getCircleMemberIds as any).mockResolvedValue([
        "user1",
        "user2",
      ]);
      // simulate two sockets from same user (multiple tabs)
      const fakeSockets = [
        { data: { user: { id: "user1" } } },
        { data: { user: { id: "user1" } } },
      ];
      // handler prefixes the room name with "circle:"
      (nsp.in(`circle:${circleId}`) as any).fetchSockets.mockResolvedValue(
        fakeSockets,
      );

      (PresenceService.isOnline as any).mockImplementation(
        (id: string) => id === "user1",
      );

      const handler = handleJoinCircle(socket, nsp);
      await handler({ circleId }, callback);

      expect(CircleService.verifyCircleExists).toHaveBeenCalledWith(circleId);
      expect(CircleService.isMember).toHaveBeenCalledWith(
        socket.data.user.id,
        circleId,
      );
      expect(socket.join).toHaveBeenCalledWith(`circle:${circleId}`);

      // presence helper should be invoked exactly once with correct args
      expect(broadcastPresenceUpdate).toHaveBeenCalledWith(circleId, nsp);
      expect(broadcastPresenceUpdate).toHaveBeenCalledTimes(1);

      // ensure the handler dedupes users across multiple tabs
      expect(callback).toHaveBeenCalledWith({
        success: true,
        presentMemberIds: ["user1"], // unique list despite two sockets
        onlineMemberIds: ["user1"],
      });

      // verify broadcast goes to room (socket.to omits the emitter itself)
      expect(socket.to).toHaveBeenCalledWith(`circle:${circleId}`);
      expect(socket.to(`circle:${circleId}`).emit).toHaveBeenCalledWith(
        "circle:member_joined",
        { user: { id: "user1", username: "alice" } },
      );
      // the raw socket.emit should never be used for this event
      expect((socket as any).emit).not.toHaveBeenCalled();

      // the joinedStudyCircles set should be created and updated
      expect(socket.data.joinedStudyCircles).toBeInstanceOf(Set);
      expect(socket.data.joinedStudyCircles.has(circleId)).toBe(true);
    });
  });

  describe("error handling", () => {
    it("reports a not-found circle using the proper message", async () => {
      const circleId = "00000000-0000-0000-0000-000000000000";
      (CircleService.verifyCircleExists as any).mockRejectedValue(
        new CircleNotFoundError(circleId),
      );

      const handler = handleJoinCircle(socket, nsp);
      await handler({ circleId }, callback);

      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: "Study circle not found",
      });
    });

    it("reports a user who isn't a member", async () => {
      const circleId = "e02c971d-2f74-4a14-a85f-bf55bd26c077";
      (CircleService.verifyCircleExists as any).mockResolvedValue(undefined);
      (CircleService.isMember as any).mockResolvedValue(false);

      const handler = handleJoinCircle(socket, nsp);
      await handler({ circleId }, callback);

      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: "Not a member of this study circle",
      });
    });

    it("propagates generic failures as a generic message", async () => {
      const circleId = "00000000-0000-0000-0000-000000000002";
      (CircleService.verifyCircleExists as any).mockRejectedValue(
        new Error("oops"),
      );

      const handler = handleJoinCircle(socket, nsp);
      await handler({ circleId }, callback);

      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: "Failed to join study circle",
      });
    });

    it("returns failure when provided data doesn't pass validation", async () => {
      const handler = handleJoinCircle(socket, nsp);
      // pass number instead of string so zod throws
      await handler({ circleId: 123 as any }, callback);

      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: "Failed to join study circle",
      });
    });
  });

  describe("idempotency and repeated joins", () => {
    it("handles joining the same circle multiple times gracefully", async () => {
      const circleId = "123e4567-e89b-12d3-a456-426614174000";

      // prepare mocks like success path
      (CircleService.verifyCircleExists as any).mockResolvedValue(undefined);
      (CircleService.isMember as any).mockResolvedValue(true);
      (CircleService.getCircleMemberIds as any).mockResolvedValue(["user1"]);
      const fakeSockets = [{ data: { user: { id: "user1" } } }];
      (nsp.in(`circle:${circleId}`) as any).fetchSockets.mockResolvedValue(
        fakeSockets,
      );
      (PresenceService.isOnline as any).mockReturnValue(true);

      // user already has the circle in their set (e.g. reopened tab)
      socket.data.joinedStudyCircles = new Set([circleId]);

      const handler = handleJoinCircle(socket, nsp);

      // first invocation should behave normally
      await handler({ circleId }, callback);
      expect(callback).toHaveBeenLastCalledWith(
        expect.objectContaining({ success: true }),
      );
      expect(socket.data.joinedStudyCircles.size).toBe(1);
      expect(socket.join).toHaveBeenCalledTimes(1);
      expect(broadcastPresenceUpdate).toHaveBeenCalledWith(circleId, nsp);

      // call again to simulate exact repeat
      await handler({ circleId }, callback);
      expect(callback).toHaveBeenLastCalledWith(
        expect.objectContaining({ success: true }),
      );
      // set still only holds one entry
      expect(socket.data.joinedStudyCircles.size).toBe(1);
      // join() was called a second time but no duplicate set entries
      expect(socket.join).toHaveBeenCalledTimes(2);
      // presence update triggered again but not multiple times per call
      expect(broadcastPresenceUpdate).toHaveBeenCalledTimes(2);
    });
  });
});
