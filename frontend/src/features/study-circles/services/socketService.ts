/* eslint-disable no-console */
import { io } from "socket.io-client";

import { useCircleStore } from "@/stores/circle.store";
import type {
  CircleMessage,
  MemberJoinedData,
  MemberLeftData,
} from "@/zodSchemas/circle.zod";

type MessageHandler = (message: CircleMessage) => void;
type ConnectionHandler = () => void;
type DiscoveryWatchHandler = (data: { counts: Record<string, number> }) => void;

/**
 * This service handles all real-time chat features.
 * It manages the connection to the server and handles live updates
 * like new messages and people joining/leaving rooms.
 */
export class CircleSocketService {
  private socket: ReturnType<typeof io> | null = null;
  private connected: boolean = false;
  private currentCircleId: string | null = null;

  // Lists of functions to run when specific events happen
  private messageHandlers: MessageHandler[] = [];
  private memberJoinedHandlers: ((data: MemberJoinedData) => void)[] = [];
  private memberLeftHandlers: ((data: MemberLeftData) => void)[] = [];
  private connectionHandlers: ConnectionHandler[] = [];
  private disconnectionHandlers: ConnectionHandler[] = [];
  private discoveryWatchHandlers: DiscoveryWatchHandler[] = [];

  /**
   * Starts the connection to the chat server.
   * If the user was already in a circle before a disconnect, it puts them back in automatically.
   */
  connect(): void {
    if (this.socket) return;

    this.socket = io(import.meta.env.VITE_CIRCLE_SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket"],
    });

    this.socket.on("connect_error", (error) => {
      console.error("Could not connect to chat:", error);
    });

    this.socket.on("connect", () => {
      this.connected = true;
      this.connectionHandlers.forEach((h) => h());

      // If we were in a room before the connection dropped, rejoin it now
      if (this.currentCircleId) {
        this.joinCircle(this.currentCircleId);
      }
    });

    this.socket.on("disconnect", () => {
      this.connected = false;
      this.disconnectionHandlers.forEach((h) => h());
    });

    // Listen for new messages
    this.socket.on("circle:new_message", (msg: CircleMessage) => {
      this.messageHandlers.forEach((h) => h(msg));
    });

    // Listen for new people entering the circle
    this.socket.on("circle:member_joined", (data: MemberJoinedData) => {
      this.memberJoinedHandlers.forEach((h) => h(data));
    });

    // Listen for people leaving the circle
    this.socket.on("circle:member_left", (data: MemberLeftData) => {
      this.memberLeftHandlers.forEach((h) => h(data));
    });

    // Listen for updates on how many people are active in various circles
    this.socket.on(
      "circle:presence_counts_update",
      (data: { counts: Record<string, number> }) => {
        this.discoveryWatchHandlers.forEach((h) => h(data));
      },
    );
  }

  /**
   * Completely stops the connection and cleans up room data.
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
   * Checks if we are currently talking to the server.
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Enters a specific chat room for a study circle.
   * Tells the server we are here and gets a list of who else is currently online.
   */
  joinCircle(circleId: string): void {
    this.currentCircleId = circleId;

    if (this.socket && this.connected) {
      this.socket.emit(
        "circle:join_room",
        { circleId },
        (response: {
          success: boolean;
          presentMemberIds?: string[];
          onlineMemberIds?: string[];
          error?: string;
        }) => {
          if (response.success) {
            // Update our local list of who is online and who is looking at this room
            if (response.onlineMemberIds) {
              useCircleStore
                .getState()
                .setOnlineMembers(response.onlineMemberIds);
            }
            if (response.presentMemberIds) {
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
   * Leaves the current chat room.
   */
  leaveCircle(circleId: string): void {
    if (this.socket && this.connected) {
      this.socket.emit("circle:leave_room", { circleId });
    }
    if (this.currentCircleId === circleId) {
      this.currentCircleId = null;
    }
  }

  /**
   * Gets the ID of the circle we are currently looking at.
   */
  getCurrentCircleId(): string | null {
    return this.currentCircleId;
  }

  /**
   * Asks the server to start sending us live "active student" counts for these circles.
   */
  startDiscoveryWatch(circleIds: string[]): void {
    if (this.socket && this.connected) {
      this.socket.emit("circle:watch_discovery", { circleIds });
    }
  }

  /**
   * Tells the server we no longer need live counts for these circles.
   */
  stopDiscoveryWatch(circleIds: string[]): void {
    if (this.socket && this.connected) {
      this.socket.emit("circle:unwatch_discovery", { circleIds });
    }
  }

  /**
   * Adds a listener for new messages.
   * Returns a function to stop listening (unsubscribe).
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  /**
   * Adds a listener for when a person joins the room.
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
   * Adds a listener for when a person leaves the room.
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
   * Adds a listener for "active student" count updates.
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
   * Adds a listener for when the connection starts.
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
   * Adds a listener for when the connection drops.
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
