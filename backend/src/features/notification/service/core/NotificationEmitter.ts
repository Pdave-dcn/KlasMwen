import type { Server as SocketIOServer } from "socket.io";

class NotificationEmitter {
  private io: SocketIOServer | null = null;

  initialize(io: SocketIOServer): void {
    this.io = io;
  }

  emit(userId: string, event: string, payload: unknown): void {
    if (!this.io) return;
    this.io.to([`user:${userId}`]).emit(event, payload);
  }

  /**
   * Check whether the emitter is ready to send messages.
   */
  get isReady(): boolean {
    return this.io !== null;
  }
}

const notificationEmitter = new NotificationEmitter();
export { notificationEmitter, NotificationEmitter };
