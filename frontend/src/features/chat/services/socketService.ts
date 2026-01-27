/* eslint-disable no-console */
import { io } from "socket.io-client";

import { useChatStore } from "@/stores/chat.store";
import type {
  ChatMessage,
  MemberJoinedData,
  MemberLeftData,
} from "@/zodSchemas/chat.zod";

type MessageHandler = (message: ChatMessage) => void;
type ConnectionHandler = () => void;

/**
 * Socket.io service for real-time chat.
 * Manages connections, room subscriptions, and message broadcasting.
 */
export class ChatSocketService {
  private socket: ReturnType<typeof io> | null = null;
  private connected: boolean = false;
  private currentRoom: string | null = null;
  private messageHandlers: MessageHandler[] = [];
  private memberJoinedHandlers: ((data: MemberJoinedData) => void)[] = [];
  private memberLeftHandlers: ((data: MemberLeftData) => void)[] = [];
  private connectionHandlers: ConnectionHandler[] = [];
  private disconnectionHandlers: ConnectionHandler[] = [];

  /**
   * Connects to chat namespace. Automatically rejoins current room on reconnection.
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

      if (this.currentRoom) {
        this.joinRoom(this.currentRoom);
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
  }

  /**
   * Disconnects from server, leaves current room, and cleans up.
   */
  disconnect(): void {
    if (this.currentRoom) {
      this.leaveRoom(this.currentRoom);
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
   * Joins a chat room by group ID.
   */
  joinRoom(chatGroupId: string): void {
    this.currentRoom = chatGroupId;

    if (this.socket && this.connected) {
      this.socket.emit(
        "chat:join",
        { chatGroupId },
        (response: {
          success: boolean;
          presentMemberIds?: string[];
          onlineMemberIds?: string[];
          error?: string;
        }) => {
          if (response.success) {
            if (response.onlineMemberIds) {
              // Bulk update the store with the "Who's already online" list
              useChatStore
                .getState()
                .setOnlineMembers(response.onlineMemberIds);
            }

            if (response.presentMemberIds) {
              // Bulk update the store with the "Who's already here" list
              useChatStore
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
   * Leaves a chat room by group ID.
   */
  leaveRoom(chatGroupId: string): void {
    if (this.socket && this.connected) {
      this.socket.emit("chat:leave", { chatGroupId });
    }
    if (this.currentRoom === chatGroupId) {
      this.currentRoom = null;
    }
  }

  /**
   * Returns the current room ID or null.
   */
  getCurrentRoom(): string | null {
    return this.currentRoom;
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
 * Singleton instance for all chat socket operations.
 */
export const chatSocketService = new ChatSocketService();
