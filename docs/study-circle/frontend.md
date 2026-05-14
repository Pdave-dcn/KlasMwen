# Study Circle Frontend Implementation

**Document Type**: Frontend Developer Guide  
**Audience**: Frontend engineers, React developers  
**Last Updated**: March 30, 2026

---

## Frontend Architecture Overview

```bash
App (React Router)
├── CirclesHub (Discovery & List)
│   ├── Components (31+)
│   ├── Hooks (Hub-specific)
│   └── Socket: Watch presence counts
│
├── CircleRoomView (Chat Interface)
│   ├── Components (22+)
│   ├── Hooks (Room-specific)
│   └── Socket: Join room, listen for messages
│
├── Zustand Store (circle.store.ts)
│   └── Shared state: UI, memberships, messages
│
├── React Query (circles.query.ts)
│   ├── useCirclesQuery (GET /circles)
│   ├── useSendMessageMutation (POST message)
│   └── useJoinCircleMutation (POST join)
│
└── Socket Service (CircleSocketService)
    └── Singleton managing /circles namespace
```

---

## State Management

### Zustand Store

**File**: `frontend/src/stores/circle.store.ts`

The single source of truth for circle-related UI state.

#### Store Structure

```typescript
interface CircleUIState {
  // UI State
  isHubOpen: boolean;
  isRoomOpen: boolean;
  selectedCircleId: string | null;
  isLoadingMessages: boolean;
  isLoadingSendingMessage: boolean;

  // Member State
  presentMemberIds: string[]; // Currently viewing circle
  onlineMemberIds: string[]; // App open

  // Message State
  messages: CircleMessage[];
  pendingMessages: CircleMessage[]; // Optimistic updates

  // Unread Tracking
  unreadCounts: Record<circleId, number>; // Per-circle

  // Actions
  setSelectedCircle(circleId: string): void;
  setPresentMembers(memberIds: string[]): void;
  addMessage(message: CircleMessage): void;
  deduplicateAndAddMessage(message: CircleMessage): void;
  updateUnreadCounts(counts: Record<string, number>): void;
}
```

#### Key Store Methods

```typescript
// Add message with deduplication check
deduplicateAndAddMessage(message: CircleMessage): void {
  // Check if message already exists by content + sender
  const exists = this.messages.some(m =>
    m.content === message.content &&
    m.sender.id === message.sender.id &&
    Math.abs(m.createdAt - message.createdAt) < 1000
  );
  if (!exists) {
    this.messages.push(message);
  }
}

// Replace optimistic message with real one
replaceOptimisticMessage(optimisticId: number, realMessage: CircleMessage): void {
  const index = this.pendingMessages.findIndex(m => m.id === optimisticId);
  if (index >= 0) {
    this.pendingMessages.splice(index, 1);
    this.messages.push(realMessage);
  }
}

// Update unread counts from batch response
updateUnreadCounts(counts: Record<string, number>): void {
  this.unreadCounts = { ...this.unreadCounts, ...counts };
}
```

---

## React Query Integration

**File**: `frontend/src/queries/circle/circles.query.ts`

Server state management with React Query (TanStack Query).

### Key Queries

```typescript
// Fetch user's circles
export const useCirclesQuery = () =>
  useQuery({
    queryKey: ["circles"],
    queryFn: () => circlesAPI.getUserCircles(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // Periodic refresh
  });

// Fetch messages for specific circle
export const useCircleMessagesQuery = (circleId: string | null) =>
  useQuery({
    queryKey: ["circles", circleId, "messages"],
    queryFn: () => circlesAPI.getMessages(circleId!),
    enabled: !!circleId,
    staleTime: 1000 * 30, // 30 seconds
  });

// Fetch circle members
export const useCircleMembersQuery = (circleId: string) =>
  useQuery({
    queryKey: ["circles", circleId, "members"],
    queryFn: () => circlesAPI.getMembers(circleId),
  });

// Fetch circle details with unread count
export const useCircleDetailsQuery = (circleId: string) =>
  useQuery({
    queryKey: ["circles", circleId],
    queryFn: () => circlesAPI.getCircleDetails(circleId),
  });
```

### Key Mutations

```typescript
// Send message
export const useSendMessageMutation = (circleId: string) => {
  const queryClient = useQueryClient();
  const store = useCircleStore();

  return useMutation({
    mutationFn: (content: string) =>
      circlesAPI.sendMessage(circleId, { content }),
    onMutate: async (content) => {
      // Create optimistic message with ID = -1
      const optimistic = {
        id: -1,
        content,
        circleId,
        sender: { id: currentUserId, username: "You" },
        createdAt: new Date(),
      };
      store.addMessage(optimistic);
    },
    onSuccess: (realMessage) => {
      // Replace optimistic with real
      store.replaceOptimisticMessage(-1, realMessage);

      // Update cache
      queryClient.setQueryData(
        ["circles", circleId, "messages"],
        (old: CircleMessage[]) => [...old, realMessage],
      );
    },
  });
};

// Join circle
export const useJoinCircleMutation = () =>
  useMutation({
    mutationFn: (circleId: string) => circlesAPI.joinStudyCircle(circleId),
    onSuccess: () => {
      // Refetch circles list
      queryClient.invalidateQueries({ queryKey: ["circles"] });
    },
  });

// Leave circle
export const useLeaveMutation = (circleId: string) =>
  useMutation({
    mutationFn: () => circlesAPI.leaveStudyCircle(circleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["circles"] });
      queryClient.removeQueries({ queryKey: ["circles", circleId] });
    },
  });

// Mute member
export const useMuteMemberMutation = (circleId: string) =>
  useMutation({
    mutationFn: ({ userId, duration }: { userId: string; duration: number }) =>
      circlesAPI.muteMember(circleId, userId, { duration }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["circles", circleId, "members"],
      });
    },
  });
```

---

## Custom Hooks

### Room Hooks (for chat interface)

**File**: `frontend/src/features/circle/room/hooks/`

#### useCircleRoom

```typescript
export function useCircleRoom(circleId: string) {
  const socket = useSocket();
  const store = useCircleStore();
  const { data: messages } = useCircleMessagesQuery(circleId);
  const { data: circle } = useCircleDetailsQuery(circleId);

  // Join socket room on mount
  useEffect(() => {
    socket.emit("circle:join_room", { circleId }, (response) => {
      if (response.success) {
        store.setPresentMembers(response.presentMemberIds);
      }
    });

    // Listen for new messages
    socket.on("circle:new_message", (message: CircleMessage) => {
      store.deduplicateAndAddMessage(message);
    });

    // Listen for member join/leave
    socket.on("circle:member_joined", ({ user }) => {
      console.log(`${user.username} joined`);
      // Could update presence state
    });

    return () => {
      socket.emit("circle:leave_room", { circleId });
      socket.off("circle:new_message");
    };
  }, [circleId, socket, store]);

  return {
    circle,
    messages: [...store.messages, ...store.pendingMessages],
    presentMembers: store.presentMemberIds,
    isLoading: store.isLoadingMessages,
  };
}
```

#### useCircleSync

```typescript
export function useCircleSync(circleId: string) {
  const queryClient = useQueryClient();
  const socket = useSocket();

  // Sync presence counts periodically
  useEffect(() => {
    const unsub = socket.on("circle:presence_counts_update", ({ counts }) => {
      // Update cache with new presence counts
      queryClient.setQueryData(["circles", circleId], (old: Circle) => ({
        ...old,
        presentMemberCount: counts[circleId],
      }));
    });

    return unsub;
  }, [circleId, socket, queryClient]);

  // Mark as read when entering room
  useEffect(() => {
    circlesAPI.updateLastReadAt(circleId);
  }, [circleId]);
}
```

#### useCirclePresence

```typescript
export function useCirclePresence(circleId: string) {
  const [presentMembers, setPresentMembers] = useState<string[]>([]);
  const [onlineMembers, setOnlineMembers] = useState<string[]>([]);

  // Socket listeners for presence
  const socket = useSocket();

  useEffect(() => {
    socket.emit("circle:join_room", { circleId }, (response) => {
      setPresentMembers(response.presentMemberIds || []);
      setOnlineMembers(response.onlineMemberIds || []);
    });

    socket.on("circle:member_joined", ({ user }) => {
      setPresentMembers((prev) =>
        prev.includes(user.id) ? prev : [...prev, user.id],
      );
    });

    socket.on("circle:member_left", ({ user }) => {
      setPresentMembers((prev) => prev.filter((id) => id !== user.id));
    });

    return () => {
      socket.emit("circle:leave_room", { circleId });
    };
  }, [circleId, socket]);

  return { presentMembers, onlineMembers };
}
```

### Hub Hooks (for discovery)

**File**: `frontend/src/features/circle/hub/hooks/`

#### useDiscoverCircles

```typescript
export function useDiscoverCircles(pagination?: PaginationParams) {
  const socket = useSocket();

  // Get circles user can join
  const { data: circles, ...rest } = useQuery({
    queryKey: ["circles", "discover", pagination],
    queryFn: () => circlesAPI.discoverCircles(pagination),
  });

  // Watch for presence updates
  useEffect(() => {
    const circleIds = circles?.map((c) => c.id) || [];
    if (circleIds.length > 0) {
      socket.emit("circle:watch_discovery", { circleIds });

      socket.on("circle:presence_counts_update", ({ counts }) => {
        // Update circles with new presence counts
      });
    }

    return () => {
      socket.emit("circle:unwatch_discovery");
    };
  }, [circles, socket]);

  return { circles, ...rest };
}
```

### Shared Hooks

#### useSocket

```typescript
export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = CircleSocketService.getInstance().socket;
    }
  }, []);

  return socketRef.current!;
}
```

#### useUnreadCounts

```typescript
export function useUnreadCounts() {
  const store = useCircleStore();
  const queryClient = useQueryClient();

  // Fetch unread counts on mount
  useEffect(() => {
    const fetchUnreads = async () => {
      const counts = await circlesAPI.getUnreadCounts();
      store.updateUnreadCounts(counts);
    };

    fetchUnreads();
  }, []);

  return store.unreadCounts;
}
```

---

## Components

### Hub Components (Discovery)

**Directory**: `frontend/src/features/circle/hub/components/`

31+ total components organized in sections:

#### Discovery Overview

- `CirclesHub` - Main hub layout
- `CircleDiscoveryTabs` - Tab switcher (Discover, Recent, Trending)
- `CircleSearchBar` - Search & filter interface
- `CircleFilterPanel` - Tag/category filters

#### Circle Cards

- `CircleCardGrid` - Grid layout of circles
- `CircleCard` - Individual circle preview
- `CircleCardHeader` - Circle name + avatar
- `CircleCardStats` - Members, messages, activity
- `CircleCardJoinButton` - Join action

#### Discovery Features

- `TrendingCircles` - Top circles by activity
- `NewCircles` - Recently created
- `RecommendedCircles` - Personalized suggestions
- `FeaturedCircles` - Admin-curated

#### Member Previews

- `CircleMemberPreview` - Mini member list
- `MemberAvatar` - User avatar
- `PresenceIndicator` - Online status dot

#### Create & Manage

- `CreateCircleDialog` - Form to create new circle
- `CircleSettings` - Settings modal
- `LeaveCircleButton` - Leave action

### Room Components (Chat)

**Directory**: `frontend/src/features/circle/room/components/`

22+ total components organized in sections:

#### Layout

- `CircleRoomView` - Main chat layout
- `CircleRoomHeader` - Circle name, members count
- `CircleRoomSidebar` - Members list sidebar
- `CircleRoomFooter` - Message input area

#### Message Display

- `MessageList` - Scrollable message feed
- `MessageItem` - Individual message
- `MessageGroup` - Messages from same sender
- `MessageTimestamp` - When message was sent
- `SystemMessage` - User joined/left messages

#### Presence & Status

- `MemberListBar` - Active members viewing
- `PresenceCard` - Who's currently here
- `OnlineIndicator` - Active status

#### Message Interaction

- `MessageMenu` - Delete, edit options
- `MessageActions` - React buttons
- `MessageQuote` - Reply/quote feature

#### Input & Actions

- `MessageInput` - Text input field
- `SendButton` - Send message action
- `AttachmentButton` - Add media (if supported)
- `EmojiPicker` - Emoji insertion

#### Member Management

- `MemberList` - Full members list
- `MemberCard` - Individual member
- `MemberRole` - Role badge (OWNER, MOD, MEMBER)
- `MuteButton` - Mute member action
- `RemoveButton` - Remove member action

#### Moderation

- `ModerationPanel` - Mod tools
- `MuteDialog` - Choose mute duration
- `ConfirmRemoveDialog` - Remove member confirmation

---

## API Integration Layer

**File**: `frontend/src/api/circle/circles.api.ts`

Abstraction over HTTP requests to backend.

### Circle Operations

```typescript
export const circlesAPI = {
  // Circles
  getUserCircles: () => fetch("/api/circles").then((r) => r.json()),
  getCircleDetails: (id: string) =>
    fetch(`/api/circles/${id}`).then((r) => r.json()),
  discoverCircles: (pagination?: any) =>
    fetch(`/api/circles?discover=true`).then((r) => r.json()),
  createStudyCircle: (data: CreateCircleData) =>
    fetch("/api/circles", { method: "POST", body: JSON.stringify(data) }).then(
      (r) => r.json(),
    ),
  updateCircle: (id: string, data: UpdateCircleData) =>
    fetch(`/api/circles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  deleteCircle: (id: string) =>
    fetch(`/api/circles/${id}`, { method: "DELETE" }).then((r) => r.json()),

  // Membership
  joinStudyCircle: (id: string) =>
    fetch(`/api/circles/${id}/join`, { method: "POST" }).then((r) => r.json()),
  leaveStudyCircle: (id: string) =>
    fetch(`/api/circles/${id}/leave`, { method: "POST" }).then((r) => r.json()),

  // Members
  getMembers: (circleId: string) =>
    fetch(`/api/circles/${circleId}/members`).then((r) => r.json()),
  searchMembers: (circleId: string, query: string) =>
    fetch(`/api/circles/${circleId}/members/search?q=${query}`).then((r) =>
      r.json(),
    ),
  addMember: (circleId: string, userId: string) =>
    fetch(`/api/circles/${circleId}/members`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }).then((r) => r.json()),
  removeMember: (circleId: string, userId: string) =>
    fetch(`/api/circles/${circleId}/members/${userId}`, {
      method: "DELETE",
    }).then((r) => r.json()),
  muteMember: (circleId: string, userId: string, data: { duration: number }) =>
    fetch(`/api/circles/${circleId}/members/${userId}/mute`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  // Messages
  getMessages: (circleId: string, cursor?: string) =>
    fetch(
      `/api/circles/${circleId}/messages${cursor ? `?cursor=${cursor}` : ""}`,
    ).then((r) => r.json()),
  sendMessage: (circleId: string, data: { content: string }) =>
    fetch(`/api/circles/${circleId}/messages`, {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  deleteMessage: (circleId: string, messageId: string) =>
    fetch(`/api/circles/${circleId}/messages/${messageId}`, {
      method: "DELETE",
    }).then((r) => r.json()),

  // Unread
  updateLastReadAt: (circleId: string) =>
    fetch(`/api/circles/${circleId}/members/me/read`, { method: "POST" }).then(
      (r) => r.json(),
    ),
  getUnreadCounts: () =>
    fetch("/api/circles/unread-counts").then((r) => r.json()),
};
```

---

## Socket Service

**File**: `frontend/src/services/CircleSocketService.ts`

Singleton managing Socket.io connection.

```typescript
export class CircleSocketService {
  private static instance: CircleSocketService;
  public socket: Socket;

  private constructor() {
    this.socket = io(import.meta.env.VITE_API_URL, {
      namespace: "/circles",
      auth: { token: getAuthToken() },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.setupListeners();
  }

  static getInstance(): CircleSocketService {
    if (!this.instance) {
      this.instance = new CircleSocketService();
    }
    return this.instance;
  }

  private setupListeners() {
    // Global error handling
    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
      // Show toast notification
    });

    this.socket.on("connect", () => {
      console.log("Connected to circles namespace");
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from circles namespace");
    });
  }

  // Methods for components to use
  joinRoom(circleId: string, callback: Function) {
    this.socket.emit("circle:join_room", { circleId }, callback);
  }

  leaveRoom(circleId: string) {
    this.socket.emit("circle:leave_room", { circleId });
  }

  watchDiscovery(circleIds: string[]) {
    this.socket.emit("circle:watch_discovery", { circleIds });
  }

  unwatchDiscovery() {
    this.socket.emit("circle:unwatch_discovery");
  }
}
```

---

## Validation Schemas

**File**: `frontend/src/zodSchemas/circle.zod.ts`

Zod schemas for form validation.

```typescript
export const createStudyCircleSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name cannot exceed 100 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  isPrivate: z.boolean().default(false),
  tagIds: z.array(z.string()).optional(),
});

export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message too long"),
});

export const updateCircleSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
});
```

---

## Message Deduplication

Critical for handling optimistic updates and network latency.

### Strategy

```typescript
// Deduplication key = content + sender + approximate timestamp
function getMessageKey(message: CircleMessage): string {
  return `${message.sender.id}:${message.content}:${
    Math.floor(message.createdAt.getTime() / 1000)
  }`;
}

// Check if message already exists
function isDuplicate(
  newMessage: CircleMessage,
  existingMessages: CircleMessage[]
): boolean {
  const newKey = getMessageKey(newMessage);
  return existingMessages.some(m => getMessageKey(m) === newKey);
}

// Store uses this for socket events
deduplicateAndAddMessage(message: CircleMessage) {
  if (!isDuplicate(message, this.messages)) {
    this.messages.push(message);
  }
}
```

### Optimistic Update Flow

```typescript
// User sends message
const { mutate: sendMessage } = useSendMessageMutation(circleId);

const handleSendMessage = async (content: string) => {
  // 1. Create optimistic message with ID = -1
  const optimisticMessage: CircleMessage = {
    id: -1,
    content,
    circleId,
    sender: getCurrentUser(),
    createdAt: new Date(),
  };

  // 2. Add to UI immediately
  store.addMessage(optimisticMessage);

  // 3. Send to server
  try {
    const realMessage = await circlesAPI.sendMessage(circleId, { content });

    // 4. Replace optimistic with real (ID = 42)
    store.replaceOptimisticMessage(-1, realMessage);

    // 5. If socket event arrives, deduplicate
    // (won't duplicate because content + sender match)
  } catch (error) {
    // Remove optimistic message on error
    store.removeMessage(-1);
  }
};
```

---

## Performance Optimization

### 1. Message List Virtualization

Use react-window for long message lists:

```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={messages.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <MessageItem
      style={style}
      message={messages[index]}
    />
  )}
</FixedSizeList>
```

### 2. Batch Unread Count Fetching

Fetch all circles' unread counts in one query instead of per-circle.

### 3. React Query Deduplication

Automatically deduplicates duplicate requests within staleTime window.

### 4. Socket Event Throttling

Don't update presence counts on every join/leave:

```typescript
const throttledPresenceUpdate = throttle(
  (counts) => store.updatePresenceCounts(counts),
  1000,
);

socket.on("circle:presence_counts_update", throttledPresenceUpdate);
```

---

## Common Patterns

### Pattern 1: Fetch & Subscribe

```typescript
function CircleRoom() {
  const { circleId } = useParams();

  // Fetch data
  const { data: circle } = useCircleDetailsQuery(circleId);

  // Subscribe to real-time
  useCircleSync(circleId);
  useCircleRoom(circleId);

  if (!circle) return <Loading />;

  return (
    <div>
      <h1>{circle.name}</h1>
      <MessageList />
    </div>
  );
}
```

### Pattern 2: Optimistic Update

```typescript
const { mutate } = useMutation({
  mutationFn: deleteFn,
  onMutate: async (id) => {
    // Cancel queries
    await queryClient.cancelQueries({ queryKey: ["circles"] });

    // Update cache optimistically
    queryClient.setQueryData(["circles"], (old) =>
      old.filter((c) => c.id !== id),
    );
  },
  onError: (err, vars, context) => {
    // Revert on error
    queryClient.setQueryData(["circles"], context?.previous);
  },
});
```

### Pattern 3: Real-Time Sync

```typescript
useEffect(() => {
  socket.on("event:data_updated", (newData) => {
    // Update Zustand store
    store.updateData(newData);

    // Update React Query cache
    queryClient.setQueryData(["key"], newData);
  });

  return () => socket.off("event:data_updated");
}, [socket]);
```

---

## Testing

### Component Tests

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CircleRoom } from "./CircleRoom";

describe("CircleRoom", () => {
  it("sends message on submit", async () => {
    const mockSendMessage = vi.fn();
    vi.mock("@/queries/circle/circles.query", () => ({
      useSendMessageMutation: () => ({ mutate: mockSendMessage })
    }));

    render(<CircleRoom circleId="circle-1" />);

    const input = screen.getByPlaceholderText("Type message...");
    await userEvent.type(input, "Hello");
    await userEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith("Hello");
    });
  });
});
```

---

## Debugging Tips

### 1. Redux DevTools for Zustand

```typescript
import { devtools } from "zustand/middleware";

const useCircleStore = create<CircleUIState>()(
  devtools(
    (set) => ({
      // Store definition
    }),
    { name: "CircleStore" },
  ),
);
```

### 2. Socket Event Logging

```typescript
socket.onAny((eventName, ...args) => {
  console.log(`[${"circle:"}] ${eventName}`, args);
});
```

### 3. React Query DevTools

```typescript
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

<ReactQueryDevtools initialIsOpen={false} />
```

---
