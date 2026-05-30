import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventBus } from "../../../src/core/events/EventBus.js";

describe("EventBus", () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  afterEach(() => {
    bus.removeAllListeners();
  });

  it("should call a subscribed listener when an event is emitted", () => {
    const listener = vi.fn();

    bus.on<{ type: "test"; value: string }>("test", listener);
    bus.emit({ type: "test", value: "hello" });

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith({ type: "test", value: "hello" });
  });

  it("should call multiple listeners for the same event", () => {
    const a = vi.fn();
    const b = vi.fn();

    bus.on("test", a);
    bus.on("test", b);
    bus.emit({ type: "test" });

    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });

  it("should call listeners synchronously (within same tick)", () => {
    const calls: string[] = [];

    bus.on("test", () => {
      calls.push("listener");
    });

    calls.push("before");
    bus.emit({ type: "test" });
    calls.push("after");

    expect(calls).toEqual(["before", "listener", "after"]);
  });

  it("should not call a listener after it has been removed", () => {
    const listener = vi.fn();

    bus.on("test", listener);
    bus.off("test", listener);
    bus.emit({ type: "test" });

    expect(listener).not.toHaveBeenCalled();
  });

  it("should not call other listeners when one is removed", () => {
    const a = vi.fn();
    const b = vi.fn();

    bus.on("test", a);
    bus.on("test", b);
    bus.off("test", a);
    bus.emit({ type: "test" });

    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledOnce();
  });

  it("should remove all listeners for a specific event type", () => {
    const a = vi.fn();
    const b = vi.fn();

    bus.on("event-a", a);
    bus.on("event-b", b);

    bus.removeAllListeners("event-a");
    bus.emit({ type: "event-a" });
    bus.emit({ type: "event-b" });

    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledOnce();
  });

  it("should remove all listeners when no event type is given", () => {
    const a = vi.fn();
    const b = vi.fn();

    bus.on("event-a", a);
    bus.on("event-b", b);

    bus.removeAllListeners();
    bus.emit({ type: "event-a" });
    bus.emit({ type: "event-b" });

    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });

  it("should report the correct listener count", () => {
    expect(bus.listenerCount("test")).toBe(0);

    const a = vi.fn();
    const b = vi.fn();

    bus.on("test", a);
    expect(bus.listenerCount("test")).toBe(1);

    bus.on("test", b);
    expect(bus.listenerCount("test")).toBe(2);

    bus.off("test", a);
    expect(bus.listenerCount("test")).toBe(1);
  });

  it("should not interfere between different event types", () => {
    const a = vi.fn();
    const b = vi.fn();

    bus.on("event-a", a);
    bus.on("event-b", b);

    bus.emit({ type: "event-a" });

    expect(a).toHaveBeenCalledOnce();
    expect(b).not.toHaveBeenCalled();
  });

  it("should not throw when emitting an event with no listeners", () => {
    expect(() => {
      bus.emit({ type: "nonexistent" });
    }).not.toThrow();
  });
});
