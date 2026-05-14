import { describe, it, expect, vi, beforeEach } from "vitest";

import { handleDiscoveryWatch } from "../../../../src/socket/circles/handlers/discoveryWatchHandler.js";

function makeSocket() {
  return {
    id: "socket1",
    data: { user: { id: "user1", username: "alice" } },
    join: vi.fn().mockResolvedValue(undefined),
    emit: vi.fn(),
  } as any;
}

function makeNamespace(rooms: Record<string, any[]>) {
  return {
    in: vi.fn((room: string) => ({
      fetchSockets: vi.fn().mockResolvedValue(rooms[room] ?? []),
    })),
  } as any;
}

describe("handleDiscoveryWatch socket handler", () => {
  let socket: any;
  let nsp: any;

  beforeEach(() => {
    socket = makeSocket();
    vi.clearAllMocks();
  });

  it("joins watch rooms and emits presence counts with deduplication", async () => {
    const circleA = "123e4567-e89b-12d3-a456-426614174000";
    const circleB = "123e4567-e89b-12d3-a456-426614174001";

    const rooms: Record<string, any[]> = {};
    // circleA has two sockets belonging to same user (two tabs)
    rooms[`circle:${circleA}`] = [
      { data: { user: { id: "user1" } } },
      { data: { user: { id: "user1" } } },
    ];

    // circleB has two distinct users
    rooms[`circle:${circleB}`] = [
      { data: { user: { id: "user2" } } },
      { data: { user: { id: "user3" } } },
    ];

    nsp = makeNamespace(rooms);

    const handler = handleDiscoveryWatch(socket, nsp);
    await handler({ circleIds: [circleA, circleB] });

    // joins watcher rooms
    expect(socket.join).toHaveBeenCalledWith(`watch:${circleA}`);
    expect(socket.join).toHaveBeenCalledWith(`watch:${circleB}`);

    // namespace queried for counting uses circle: prefix
    expect(nsp.in).toHaveBeenCalledWith(`circle:${circleA}`);
    expect(nsp.in).toHaveBeenCalledWith(`circle:${circleB}`);

    // emitted counts should dedupe user1 in circleA to 1
    expect(socket.emit).toHaveBeenCalledWith("circle:presence_counts_update", {
      counts: {
        [circleA]: 1,
        [circleB]: 2,
      },
    });
  });

  it("returns early on empty or invalid data and does no joins/emits", async () => {
    // empty array
    nsp = makeNamespace({});
    const handler = handleDiscoveryWatch(socket, nsp);
    await handler({ circleIds: [] });
    expect(socket.join).not.toHaveBeenCalled();
    expect(socket.emit).not.toHaveBeenCalled();

    // null
    vi.clearAllMocks();
    await handler(null as any);
    expect(socket.join).not.toHaveBeenCalled();
    expect(socket.emit).not.toHaveBeenCalled();

    // non-array
    vi.clearAllMocks();
    await handler({ circleIds: "not-an-array" as any } as any);
    expect(socket.join).not.toHaveBeenCalled();
    expect(socket.emit).not.toHaveBeenCalled();
  });
});
