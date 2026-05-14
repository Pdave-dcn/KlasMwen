import { describe, it, expect, vi, beforeEach } from "vitest";

import { handleDiscoveryUnwatch } from "../../../../src/socket/circles/handlers/discoveryUnwatchHandler.js";

function makeSocket() {
  return {
    id: "socket1",
    data: { user: { id: "user1", username: "alice" } },
    leave: vi.fn().mockResolvedValue(undefined),
  } as any;
}

describe("handleDiscoveryUnwatch socket handler", () => {
  let socket: any;

  beforeEach(() => {
    socket = makeSocket();
    vi.clearAllMocks();
  });

  it("leaves each watch room when valid circleIds provided", async () => {
    const ids = [
      "123e4567-e89b-12d3-a456-426614174000",
      "123e4567-e89b-12d3-a456-426614174001",
    ];

    const handler = handleDiscoveryUnwatch(socket);
    await handler({ circleIds: ids });

    expect(socket.leave).toHaveBeenCalledWith(`watch:${ids[0]}`);
    expect(socket.leave).toHaveBeenCalledWith(`watch:${ids[1]}`);
    expect(socket.leave).toHaveBeenCalledTimes(2);
  });

  it("returns early when data is missing, empty or invalid", async () => {
    const handler = handleDiscoveryUnwatch(socket);

    await handler({ circleIds: [] });
    expect(socket.leave).not.toHaveBeenCalled();

    await handler(null as any);
    expect(socket.leave).not.toHaveBeenCalled();

    await handler({ circleIds: "not-an-array" as any } as any);
    expect(socket.leave).not.toHaveBeenCalled();
  });
});
