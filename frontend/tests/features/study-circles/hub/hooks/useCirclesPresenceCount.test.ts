import { renderHook, cleanup, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// hoisted mocks
const storeMock = vi.hoisted(() => ({
  updateCircleActivityCounts: vi.fn(),
}));

// circleSocketService mock holder - will allow triggering the registered handler
const serviceHolder = vi.hoisted(() => {
  let watchHandler:
    | ((data: { counts: Record<string, number> }) => void)
    | null = null;
  return {
    startDiscoveryWatch: vi.fn((_ids: string[]) => {}),
    stopDiscoveryWatch: vi.fn((_ids: string[]) => {}),
    onDiscoveryWatch: vi.fn((handler: any) => {
      watchHandler = handler;
      return () => {
        watchHandler = null;
      };
    }),
    _trigger: (data: { counts: Record<string, number> }) => {
      if (watchHandler) watchHandler(data);
    },
  } as any;
});

vi.mock("@/stores/presence.store", () => ({
  usePresenceStore: vi.fn(() => storeMock),
}));

vi.mock("@/features/study-circles/services/socketService", () => ({
  circleSocketService: serviceHolder,
}));

import { useCirclesPresenceCount } from "@/features/study-circles/hub/hooks/useCirclesPresenceCount";

describe("useCirclesPresenceCount hook", () => {
  const ids = ["circle-1", "circle-2"];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("starts discovery watch and registers listener on mount", async () => {
    const { unmount } = renderHook(() => useCirclesPresenceCount(ids));
    // flush effects
    await act(() => Promise.resolve());
    expect(serviceHolder.startDiscoveryWatch).toHaveBeenCalledWith(ids);
    expect(serviceHolder.onDiscoveryWatch).toHaveBeenCalled();

    unmount();
  });

  it("calls stopDiscoveryWatch and unsubscribe on unmount", async () => {
    const { unmount } = renderHook(() => useCirclesPresenceCount(ids));
    await act(() => Promise.resolve());

    // capture unsubscribe returned by mock
    const unsub = serviceHolder.onDiscoveryWatch.mock.results[0].value;
    expect(typeof unsub).toBe("function");

    unmount();
    // after unmount should have stopped discovery
    expect(serviceHolder.stopDiscoveryWatch).toHaveBeenCalledWith(ids);
  });

  it("syncs counts from socket to store", async () => {
    renderHook(() => useCirclesPresenceCount(ids));
    await act(() => Promise.resolve());
    const counts = { "circle-1": 5 };
    serviceHolder._trigger({ counts });
    expect(storeMock.updateCircleActivityCounts).toHaveBeenCalledWith(counts);
  });

  it("does not restart effect when same stringified ids passed", async () => {
    const { rerender } = renderHook(({ ids }) => useCirclesPresenceCount(ids), {
      initialProps: { ids },
    });
    await act(() => Promise.resolve());

    expect(serviceHolder.startDiscoveryWatch).toHaveBeenCalledTimes(1);
    // rerender with new array same contents
    rerender({ ids: [...ids] });
    await act(() => Promise.resolve());
    expect(serviceHolder.startDiscoveryWatch).toHaveBeenCalledTimes(1);
  });

  it("does nothing when circleIds empty", () => {
    renderHook(() => useCirclesPresenceCount([]));
    expect(serviceHolder.startDiscoveryWatch).not.toHaveBeenCalled();
    expect(serviceHolder.onDiscoveryWatch).not.toHaveBeenCalled();
  });
});
