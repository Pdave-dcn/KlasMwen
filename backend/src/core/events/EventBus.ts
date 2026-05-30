import { EventEmitter } from "events";

/**
 * A simple event bus for decoupled communication between services.
 * Services can emit events without knowing who listens to them,
 * and listeners can react to events without knowing who emits them.
 */
class EventBus {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(20);
  }

  /**
   * Subscribe to an event type.
   * The listener is called synchronously when emit() is called.
   */
  on<T extends { type: string }>(
    eventType: T["type"],
    listener: (event: T) => void | Promise<void>,
  ): void {
    this.emitter.on(eventType, listener);
  }

  /**
   * Unsubscribe a listener.
   * Important for cleanup in tests to prevent cross-test interference.
   */
  off<T extends { type: string }>(
    eventType: T["type"],
    listener: (event: T) => void | Promise<void>,
  ): void {
    this.emitter.off(eventType, listener);
  }

  /**
   * Publish an event. All subscribers are called synchronously
   * in the order they registered.
   */
  emit<T extends { type: string }>(event: T): void {
    this.emitter.emit(event.type, event);
  }

  /**
   * Remove all listeners for a specific event type.
   */
  removeAllListeners(eventType?: string): void {
    if (eventType) {
      this.emitter.removeAllListeners(eventType);
    } else {
      this.emitter.removeAllListeners();
    }
  }

  /**
   * Get the count of registered listeners for an event.
   */
  listenerCount(eventType: string): number {
    return this.emitter.listenerCount(eventType);
  }
}

const eventBus = new EventBus();
export { eventBus, EventBus };
