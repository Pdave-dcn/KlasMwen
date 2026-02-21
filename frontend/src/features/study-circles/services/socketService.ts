/* eslint-disable no-console */
import { io } from "socket.io-client";

import { useCircleStore } from "@/stores/circle.store";
import type {
  ChatMessage,
  MemberJoinedData,
  MemberLeftData,
} from "@/zodSchemas/chat.zod";

type MessageHandler = (message: ChatMessage) => void;
type ConnectionHandler = () => void;
type DiscoveryWatchHandler = (data: { counts: Record<string, number> }) => void;

/**
 * Socket.io service for real-time chat.
 * Manages connections, room subscriptions, and message broadcasting.
 */
export class CircleSocketService {
  private socket: ReturnType<typeof io> | null = null;
  private connected: boolean = false;
  private currentCircleId: string | null = null;
  private messageHandlers: MessageHandler[] = [];
  private memberJoinedHandlers: ((data: MemberJoinedData) => void)[] = [];
  private memberLeftHandlers: ((data: MemberLeftData) => void)[] = [];
  private connectionHandlers: ConnectionHandler[] = [];
  private disconnectionHandlers: ConnectionHandler[] = [];
  private discoveryWatchHandlers: DiscoveryWatchHandler[] = [];

  /**
   * Connects to the circle namespace. Automatically rejoins the active circle on reconnection.
   */
  connect(): void {
    if (this.socket) return;

    this.socket = io(import.meta.env.VITE_CHAT_SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket"],
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket.io connection error:", error);
    });

    this.socket.on("connect", () => {
      this.connected = true;
      this.connectionHandlers.forEach((h) => h());

      if (this.currentCircleId) {
        this.joinCircle(this.currentCircleId);
      }
    });

    this.socket.on("disconnect", () => {
      this.connected = false;
      this.disconnectionHandlers.forEach((h) => h());
    });

    this.socket.on("chat:new_message", (msg: ChatMessage) => {
      this.messageHandlers.forEach((h) => h(msg));
    });

    this.socket.on("chat:member_joined", (data: MemberJoinedData) => {
      this.memberJoinedHandlers.forEach((h) => h(data));
    });

    this.socket.on("chat:member_left", (data: MemberLeftData) => {
      this.memberLeftHandlers.forEach((h) => h(data));
    });

    this.socket.on(
      "chat:presence_counts_update",
      (data: { counts: Record<string, number> }) => {
        this.discoveryWatchHandlers.forEach((h) => h(data));
      },
    );
  }

  /**
   * Disconnects from server, leaves current room, and cleans up.
   */
  disconnect(): void {
    if (this.currentCircleId) {
      this.leaveCircle(this.currentCircleId);
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
    this.disconnectionHandlers.forEach((handler) => handler());
  }

  /**
   * Returns true if socket is connected.
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Joins a specific study circle room.
   */
  joinCircle(circleId: string): void {
    this.currentCircleId = circleId;

    if (this.socket && this.connected) {
      this.socket.emit(
        "chat:join",
        { circleId },
        (response: {
          success: boolean;
          presentMemberIds?: string[];
          onlineMemberIds?: string[];
          error?: string;
        }) => {
          if (response.success) {
            if (response.onlineMemberIds) {
              // Bulk update the store with the "Who's already online" list
              useCircleStore
                .getState()
                .setOnlineMembers(response.onlineMemberIds);
            }

            if (response.presentMemberIds) {
              // Bulk update the store with the "Who's already here" list
              useCircleStore
                .getState()
                .setPresentMembers(response.presentMemberIds);
            }
          } else if (response.error) {
            console.error("Failed to join room:", response.error);
          }
        },
      );
    } else {
      console.log("Socket not connected yet, room join queued for connection.");
    }
  }

  /**
   * Leaves a study circle room.
   */
  leaveCircle(circleId: string): void {
    if (this.socket && this.connected) {
      this.socket.emit("chat:leave", { circleId });
    }
    if (this.currentCircleId === circleId) {
      this.currentCircleId = null;
    }
  }

  /**
   * Returns the current study circle room ID or null.
   */
  getCurrentCircleId(): string | null {
    return this.currentCircleId;
  }

  /**
   * Starts watching presence counts for given study circle IDs.
   */
  startDiscoveryWatch(circleIds: string[]): void {
    if (this.socket && this.connected) {
      this.socket.emit("chat:discovery_watch", { circleIds });
    }
  }

  /**
   * Stops watching presence counts for given chat group IDs.
   */
  stopDiscoveryWatch(circleIds: string[]): void {
    if (this.socket && this.connected) {
      this.socket.emit("chat:discovery_unwatch", { circleIds });
    }
  }

  /**
   * Registers a handler for incoming messages. Returns unsubscribe function.
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler);

    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  /**
   * Registers a handler for member joined events. Returns unsubscribe function.
   */
  onMemberJoined(handler: (data: MemberJoinedData) => void): () => void {
    this.memberJoinedHandlers.push(handler);
    return () => {
      this.memberJoinedHandlers = this.memberJoinedHandlers.filter(
        (h) => h !== handler,
      );
    };
  }

  /**
   * Registers a handler for member left events. Returns unsubscribe function.
   */
  onMemberLeft(handler: (data: MemberLeftData) => void): () => void {
    this.memberLeftHandlers.push(handler);
    return () => {
      this.memberLeftHandlers = this.memberLeftHandlers.filter(
        (h) => h !== handler,
      );
    };
  }

  /**
   * Registers a handler for discovery watch updates. Returns unsubscribe function.
   */
  onDiscoveryWatch(handler: DiscoveryWatchHandler): () => void {
    this.discoveryWatchHandlers.push(handler);
    return () => {
      this.discoveryWatchHandlers = this.discoveryWatchHandlers.filter(
        (h) => h !== handler,
      );
    };
  }

  /**
   * Simulates receiving a message locally without server communication.
   * Useful for optimistic updates.
   */
  simulateIncomingMessage(message: ChatMessage): void {
    this.messageHandlers.forEach((handler) => handler(message));
  }

  /**
   * Registers a handler for connection events. Returns unsubscribe function.
   */
  onConnect(handler: ConnectionHandler): () => void {
    this.connectionHandlers.push(handler);
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter(
        (h) => h !== handler,
      );
    };
  }

  /**
   * Registers a handler for disconnection events. Returns unsubscribe function.
   */
  onDisconnect(handler: ConnectionHandler): () => void {
    this.disconnectionHandlers.push(handler);
    return () => {
      this.disconnectionHandlers = this.disconnectionHandlers.filter(
        (h) => h !== handler,
      );
    };
  }
}

/**
 * Singleton instance for all real-time circle operations.
 */
export const circleSocketService = new CircleSocketService();
