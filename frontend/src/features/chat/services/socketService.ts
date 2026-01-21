import { io } from "socket.io-client";

import type { ChatMessage } from "@/zodSchemas/chat.zod";

type MessageHandler = (message: ChatMessage) => void;
type ConnectionHandler = () => void;

/**
 * Socket.io service for real-time chat functionality.
 * Handles connection management, room subscriptions, and message broadcasting.
 *
 * @example
 * ```typescript
 * // Connect to chat namespace
 * chatSocketService.connect('/chat');
 *
 * // Join a chat room
 * chatSocketService.joinRoom('group-uuid');
 *
 * // Listen for new messages
 * const unsubscribe = chatSocketService.onMessage((message) => {
 *   console.log('New message:', message);
 * });
 *
 * // Send a message
 * chatSocketService.sendMessage('group-uuid', 'Hello!');
 *
 * // Cleanup
 * unsubscribe();
 * chatSocketService.disconnect();
 * ```
 */
class ChatSocketService {
  private socket: ReturnType<typeof io> | null = null;
  private connected: boolean = false;
  private currentRoom: string | null = null;
  private messageHandlers: MessageHandler[] = [];
  private connectionHandlers: ConnectionHandler[] = [];
  private disconnectionHandlers: ConnectionHandler[] = [];

  /**
   * Establishes Socket.io connection to the chat namespace.
   * Automatically rejoins the current room on reconnection.
   *
   * @param namespace - Socket.io namespace to connect to (default: "/chat")
   *
   * @example
   * ```typescript
   * chatSocketService.connect('/chat');
   * ```
   */
  connect(namespace: string = "/chat"): void {
    if (this.socket) return;

    this.socket = io(import.meta.env.VITE_SOCKET_URL + namespace, {
      withCredentials: true,
      transports: ["websocket"],
    });

    this.socket.on("connect", () => {
      this.connected = true;
      this.connectionHandlers.forEach((h) => h());

      // Rejoin room if previously connected
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
  }

  /**
   * Disconnects from the Socket.io server.
   * Leaves current room and cleans up connection.
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
   * Checks if socket is currently connected.
   *
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Joins a chat room (group). Automatically leaves previous room if any.
   * Only allows being in one room at a time.
   *
   * @param chatGroupId - UUID of the chat group to join
   *
   * @example
   * ```typescript
   * chatSocketService.joinRoom('chat-group-uuid');
   * ```
   */
  joinRoom(chatGroupId: string): void {
    if (this.currentRoom === chatGroupId) return;

    if (this.currentRoom) {
      this.leaveRoom(this.currentRoom);
    }

    if (this.socket && this.connected) {
      this.socket.emit("chat:join", { chatGroupId });
    }
    this.currentRoom = chatGroupId;
  }

  /**
   * Leaves a chat room (group).
   *
   * @param chatGroupId - UUID of the chat group to leave
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
   * Gets the ID of the currently joined room.
   *
   * @returns Chat group UUID or null if not in any room
   */
  getCurrentRoom(): string | null {
    return this.currentRoom;
  }

  /**
   * Registers a handler for incoming messages.
   * Handler is called whenever a new message is received in the current room.
   *
   * @param handler - Callback function to handle new messages
   * @returns Unsubscribe function to remove the handler
   *
   * @example
   * ```typescript
   * const unsubscribe = chatSocketService.onMessage((message) => {
   *   console.log('New message:', message);
   *   addMessageToUI(message);
   * });
   *
   * // Later, cleanup
   * unsubscribe();
   * ```
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler);

    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  /**
   * Simulates receiving a message without server communication.
   * Useful for optimistic UI updates or testing.
   *
   * @param message - Message object to simulate
   *
   * @example
   * ```typescript
   * // Optimistic update before server confirms
   * chatSocketService.simulateIncomingMessage({
   *   id: Date.now(),
   *   content: 'My message',
   *   sender: currentUser,
   *   createdAt: new Date().toISOString()
   * });
   * ```
   */
  simulateIncomingMessage(message: ChatMessage): void {
    this.messageHandlers.forEach((handler) => handler(message));
  }

  /**
   * Registers a handler for connection events.
   * Called when socket successfully connects or reconnects.
   *
   * @param handler - Callback function to handle connection
   * @returns Unsubscribe function to remove the handler
   *
   * @example
   * ```typescript
   * const unsubscribe = chatSocketService.onConnect(() => {
   *   console.log('Connected to chat server');
   *   showNotification('Connected');
   * });
   * ```
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
   * Registers a handler for disconnection events.
   * Called when socket disconnects from server.
   *
   * @param handler - Callback function to handle disconnection
   * @returns Unsubscribe function to remove the handler
   *
   * @example
   * ```typescript
   * const unsubscribe = chatSocketService.onDisconnect(() => {
   *   console.log('Disconnected from chat server');
   *   showNotification('Connection lost');
   * });
   * ```
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
 * Singleton instance of ChatSocketService.
 * Use this for all chat socket operations throughout the application.
 *
 * @example
 * ```typescript
 * import { chatSocketService } from '@/features/chat/services/socketService';
 *
 * // In component
 * useEffect(() => {
 *   chatSocketService.connect();
 *   chatSocketService.joinRoom(groupId);
 *
 *   const unsubscribe = chatSocketService.onMessage(handleMessage);
 *
 *   return () => {
 *     unsubscribe();
 *     chatSocketService.leaveRoom(groupId);
 *   };
 * }, [groupId]);
 * ```
 */
export const chatSocketService = new ChatSocketService();
