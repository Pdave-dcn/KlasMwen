# Study Circle Architecture

**Document Type**: System Design & High-Level Overview  
**Audience**: Senior engineers, architects, tech leads  
**Last Updated**: March 30, 2026

---

## System Architecture Overview

```bash
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
├─────────────────────────────────────────────────────────────┤
│ UI Layer: CircleHub, CircleRoomView, MessageList, MemberList│
│ State: Zustand store + React Query caching                  │
│ Real-time: Socket.io client for event subscription          │
└────────────────┬────────────────────────────────────────────┘
                 │ REST API + WebSocket
                 │
┌────────────────▼────────────────────────────────────────────┐
│              Gateway & Middleware Layer                      │
├─────────────────────────────────────────────────────────────┤
│ Authentication | CORS | Logging | Error Handling            │
│ Circle RBAC Middleware | Rate Limiting                       │
└────────────────┬────────────────────────────────────────────┘
                 │
    ┌────────────┴────────────┬──────────────────┐
    │                         │                  │
┌───▼──────────┐  ┌──────────▼──────┐  ┌────────▼──────┐
│ REST Routes  │  │ Socket.io       │  │ Real-time     │
│ /api/circles │  │ /circles        │  │ Events        │
└───┬──────────┘  │ namespace       │  └────────┬──────┘
    │             └──────────┬──────┘          │
    │                        │                  │
    └────────────┬───────────┴──────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│         Controllers (Endpoint Handlers)                      │
├─────────────────────────────────────────────────────────────┤
│ CircleCoreController | CircleMemberController                │
│ CircleMessageController                                      │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│       Service Layer (Business Logic)                         │
├─────────────────────────────────────────────────────────────┤
│ CircleService (Facade)                                       │
│   ├─ CircleCoreService (CRUD, Discovery)                    │
│   ├─ CircleMemberService (Permissions, Roles)               │
│   ├─ CircleMessageService (Messaging, Validation)           │
│   ├─ CircleValidationService (Assertions)                   │
│   └─ CircleSearchService (Full-text, Recommendations)       │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│     Repository Layer (Data Access & Optimization)            │
├─────────────────────────────────────────────────────────────┤
│ CircleRepository                                             │
│   ├─ Batch unread counting (single SQL query)               │
│   ├─ Cursor-based pagination                                │
│   ├─ Optimized member lookups                               │
│   └─ Message history retrieval                              │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│         Database (PostgreSQL + Prisma ORM)                   │
├─────────────────────────────────────────────────────────────┤
│ Circle, CircleMember, CircleMessage, CircleAvatar, CircleTag│
│ Indexes on: (circleId, createdAt), (circleId, userId)       │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

### Request Flow Diagram

```bash
User Action (Frontend)
    ↓
Socket.io Event / REST Request
    ↓
    ├─→ [Socket Handler] → Service → Repository → DB
    │                        ↓
    │                    Emit Response Event
    │
    └─→ [REST Controller] → Service → Repository → DB
                              ↓
                          JSON Response
```

### Service Delegation Model

```bash
CircleService (Facade)
├── CircleCoreService
│   ├── createCircle()
│   ├── joinCircle()
│   ├── leaveCircle()
│   ├── getCircleById()
│   ├── getUserCircles()
│   └── updateCircle()
│
├── CircleMemberService
│   ├── addMemberToCircle()  ← UNIFIED member addition
│   ├── removeMember()
│   ├── updateMemberRole()
│   ├── muteMember()
│   ├── getCircleMembers()
│   └── searchCircleMembers()
│
├── CircleMessageService
│   ├── sendMessage()
│   ├── getMessages()
│   ├── deleteMessage()
│   └── getLatestMessage()
│
├── CircleValidationService
│   ├── verifyCircleExists()
│   ├── checkMembership()
│   └── ensureMemberNotMuted()
│
└── CircleSearchService
    ├── discoverCircles()
    ├── getTrendingCircles()
    └── searchCircles()
```

---

## Real-Time Communication Architecture

### WebSocket Event Flow

```bash
┌─────────────────────────────────────────────────────────────┐
│                  Frontend (Socket.io Client)                 │
└────────┬─────────────────────────────────────────────────────┘
         │
         │ circle:join_room { circleId }
         ↓
┌─────────────────────────────────────────────────────────────┐
│      Backend (Socket.io /circles namespace)                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ joinCircleHandler                                     │  │
│  │  1. Validate membership                               │  │
│  │  2. socket.join(`circle:{circleId}`)                 │  │
│  │  3. Broadcast member_joined event                     │  │
│  │  4. Send presence update                              │  │
│  └───────────────────────────────────────────────────────┘  │
└────────┬─────────────────────────────────────────────────────┘
         │
         │ circle:new_message (broadcast to room)
         ↓
┌─────────────────────────────────────────────────────────────┐
│                  All Members in Room                          │
│  Receive: { message, sender, createdAt, ... }               │
│  Client-side dedup: Match by content + sender               │
└─────────────────────────────────────────────────────────────┘
```

### Socket Rooms Architecture

```bash
Socket.io Server (/circles namespace)
├── circle:circle-id-1 (Room)
│   ├── User A (socket connection)
│   ├── User B (socket connection)
│   └── User C (socket connection)
│
├── circle:circle-id-2 (Room)
│   ├── User A (socket connection)
│   └── User D (socket connection)
│
└── discovery (Presence watchers)
    ├── User A (watching multiple circles)
    ├── User E (discovering circles)
    └── User F (discovering circles)
```

---

## Data Model Relationships

### Entity Relationship Diagram

```bash
                    User
                     ↑
          ┌──────────┼──────────┐
          │          │          │
       creator    member    sender
          │          │          │
    ┌─────▼──────┐   │   ┌──────▼─────┐
    │   Circle   │   │   │CircleMessage│
    │  (Study    │◄──┤   │ (Messaging) │
    │  Group)    │   │   └─────────────┘
    │            │   │
    │ - id       │   │
    │ - name     │   │
    │ - private  │   │
    │ - avatar   │   │
    └─────┬──────┘   │
          │          │
          └─────────CircleMember
                     (Junction)
                     - role
                     - joinedAt
                     - lastReadAt
                     - mutedUntil

    CircleMember
          ↑
          ├─ OWNER (can delete, manage all)
          ├─ MODERATOR (can moderate, manage members)
          └─ MEMBER (can message, view)
```

### Data Dependencies

```bash
Circle Creation
    ↑
    ├─ User (creator)
    ├─ CircleAvatar (optional)
    └─ CircleTag (searchable tags)

CircleMember Addition
    ↑
    ├─ Circle (must exist)
    ├─ User (must exist)
    ├─ Permission check (creation context)
    └─ lastReadAt initialization (prevents old message flood)

CircleMessage
    ↑
    ├─ Circle (must exist)
    ├─ User/Sender (must exist)
    ├─ Mute check (sender not muted)
    └─ Membership validation
```

---

## Unread Message Tracking Flow

### Lifecycle

```bash
1. User Joins Circle
   └─→ CircleMemberService.addMemberToCircle()
       └─→ CircleRepository.addMember(data, lastReadAt: new Date())
           └─→ Sets lastReadAt = NOW (prevents pre-join message flooding)

2. Messages Arrive
   └─→ Other members send messages
       └─→ createdAt > lastReadAt counts as UNREAD for this member

3. Member Enters Chat
   └─→ Frontend calls updateLastReadAt()
       └─→ CircleMemberService.updateLastReadAt()
           └─→ lastReadAt = NOW

4. Unread Queue Clears
   └─→ All messages with createdAt < lastReadAt hidden in unread counter
       └─→ countUnreadMessagesBatch() runs SQL:
           SELECT circleId, COUNT(*) as unread_count
           FROM CircleMessage
           WHERE circleId IN (user's circles)
           AND createdAt > COALESCE(lastReadAt, '1970-01-01')
           AND senderId != userId
           GROUP BY circleId
```

### Batch Query Optimization

```bash
UNOPTIMIZED (N+1 Problem)
Loop through each of user's 20 circles:
  SELECT COUNT(*) FROM CircleMessage
  WHERE circleId = ? AND createdAt > ?
  Result: 20 queries to database

OPTIMIZED (Single Query)
SELECT
  m.circleId,
  COUNT(*) as unread_count
FROM CircleMessage m
LEFT JOIN CircleMember cm
  ON cm.circleId = m.circleId
  AND cm.userId = ?
WHERE m.circleId IN (user's circles)
AND m.createdAt > COALESCE(cm.lastReadAt, '1970-01-01')
AND m.senderId != ?
GROUP BY m.circleId
Result: 1 query returning all counts
```

---

## Presence Tracking Architecture

### Dual-Layer Presence

#### Layer 1: Present Members (Actively Viewing)

```bash
User views CircleRoomView
    ↓
Socket emits circle:join_room
    ↓
getTaxiPresenceMembers() returns member IDs currently viewing
    ↓
UI shows "User A, User B, + 2 more are here"
```

#### Layer 2: Online Members (App Open)

```bash
User has app open (any page)
    ↓
Maintained via app-wide socket connection
    ↓
getOnlineMemberIds() returns all members with active socket
    ↓
Used for notifications, presence status
```

### Presence Broadcasting

```bash
Circle List View (Hub)
    ↓
circle:watch_discovery { circleIds: [...] }
    ↓
Server joins user to discovery:circle-id rooms
    ↓
When members join/leave any circle:
    circle:presence_counts_update broadcast
    ↓
Frontend updates circle preview with member count
```

---

## Error Handling Hierarchy

### Error Types & HTTP Status

```bash
CircleNotFoundError (404)
    ├─ Circle with ID doesn't exist
    └─ User cannot access circle

NotAMemberError (403)
    ├─ User not in circle members
    └─ Cannot perform action

AlreadyMemberError (409)
    ├─ User already member
    └─ Cannot join twice

AuthorizationError (403)
    ├─ Insufficient permissions (role check)
    ├─ Cannot modify, delete, or add members
    └─ CircleRole < required role

MessageNotFoundError (404)
    ├─ Message with ID doesn't exist
    └─ User cannot access message

MemberMutedError (403)
    ├─ Member is muted
    └─ Cannot send messages
```

### Error Flow

```bash
Request Handler
    ↓
Middleware: Check auth, CORS, logging
    → Error: 401 Unauthorized
    ↓
Controller: Validate input
    → Error: 400 Bad Request
    ↓
Service: Business logic
    → Error: 403 Forbidden (permissions)
    → Error: 404 Not Found (entity)
    → Error: 409 Conflict (state mismatch)
    ↓
Repository: Database access
    → Error: 500 Internal Server Error
    ↓
Success: Return data or 200 OK
```

---

## Performance Considerations

### Query Optimization

| Operation             | Query Type      | Performance         |
| --------------------- | --------------- | ------------------- |
| Get user's circles    | Batch join      | O(n) ∝ user circles |
| Count unread messages | Batch SQL       | O(1) constant query |
| Search circle members | Full-text index | O(log n) indexed    |
| Paginate messages     | Cursor-based    | O(1) constant       |
| Get circle members    | Indexed lookup  | O(n) ∝ members      |

### Scaling Strategies

1. **Message Pagination**: Use cursor (last message ID) not offset
2. **Batch Unread**: Single SQL query vs. per-circle queries
3. **Presence Discovery**: Separate Socket.io rooms per circle (not broadcast all)
4. **Connection Pooling**: Prisma connection pool for database

---

## Security Architecture

### Authentication & Authorization

```bash
Request
    ↓
JWT Validation (requireAuth middleware)
    → Error: 401 if invalid/expired
    ↓
Circle Middleware (enrichCircleRole)
    → Attach user's role for this circle
    ↓
RBAC Check (assertCirclePermission)
    ├─ Resource: "circles", "circleMembers", "circleMessages"
    ├─ Action: "read", "create", "update", "delete"
    ├─ Role check: OWNER > MODERATOR > MEMBER
    → Error: 403 if insufficient
    ↓
Business Logic & DB Operation
    ↓
Response with data/success
```

### Permission Hierarchy

```bash
OWNER (Circle creator, full control)
  ├─ Can update circle metadata
  ├─ Can delete entire circle
  ├─ Can manage all members (add, remove, role change)
  ├─ Can mute/unmute anyone
  ├─ Can delete any message
  └─ INHERITS: MODERATOR + MEMBER permissions

MODERATOR (Trusted member)
  ├─ Can add members (public invite)
  ├─ Can remove MEMBER roles
  ├─ Can mute MEMBER members
  ├─ Candelete any message
  └─ INHERITS: MEMBER permissions

MEMBER (Standard member)
  ├─ Can send messages
  ├─ Can delete own messages
  ├─ Can view members
  ├─ Can leave circle
  └─ Cannot manage

NON-MEMBER
  ├─ Can view public circle preview
  ├─ Can join public circles (becomes MEMBER)
  └─ Cannot access private circles
```

---

## Deployment Architecture

### Environment Requirements

```bash
Production Environment
├── Node.js + Express server
├── PostgreSQL database
│   └─ Indexes: (Circle.creatorId), (CircleMember.userId, circleId)
│   └─ Indexes: (CircleMessage.circleId, createdAt)
├── Socket.io with Redis adapter (for multi-server)
├── JWT secret for authentication
└─ Rate limiting configured
```

### Horizontal Scaling

```bash
Load Balancer
    ↓
    ├─→ Server 1 (Express + Socket.io)
    ├─→ Server 2 (Express + Socket.io)
    └─→ Server N (Express + Socket.io)
    ↓
Redis Adapter (Socket.io across servers)
    ↓
PostgreSQL (Single shared database)
```

---

## Testing Architecture

### Test Coverage

```bash
Unit Tests
├── CircleService (mocked repository)
├── CircleMemberService (validation + delegation)
├── CircleMessageService (message logic)
├── CircleRepository (SQL queries)
└─ Error classes

Integration Tests (Socket)
├── joinCircleHandler (room join, presence)
├── sendMessageHandler (message delivery, dedup)
└─ discoveryWatchHandler (presence broadcast)

E2E Tests
├── Create circle → Join → Send message → Unread counting
├── Mute member → Attempt message → Error
└─ Leave → Presence update
```

---

## Key Architectural Decisions

### 1. Unified Member Addition

**Decision**: All members additions (self-join, admin-add, creation) go through `CircleMemberService.addMemberToCircle()`

**Rationale**:

- Single source of truth for permissions
- Ensures consistent `lastReadAt` initialization
- Prevents logic divergence bugs

**Trade-off**:

- Different flows (public join vs admin invite) use same method
- Requires flexible permission context parameter

### 2. Batch Unread Counting

**Decision**: Single SQL query with LEFT JOIN for all circles instead of per-circle queries

**Rationale**:

- Eliminates N+1 queries
- Scales constant time O(1) regardless of circle count
- Handles NULL `lastReadAt` gracefully

**Trade-off**:

- Cannot cache per-circle unread (batch recomputes all)
- SQL complexity increases slightly

### 3. Cursor-Based Message Pagination

**Decision**: Use message ID as cursor instead of offset/limit

**Rationale**:

- Handles new messages between pagination calls
- Works with real-time message arrivals
  -Consistent sorting

**Trade-off**:

- Slightly more complex query logic
- Cannot jump to page 5 directly

### 4. Presence Dual-Layer

**Decision**: Separate "viewing" vs "app open" presence tracking

**Rationale**:

- "Viewing" shows active chat participants
- "App open" used for notification state
- Prevents false "user left" when navigating pages

**Trade-off**:

- Requires dual Socket.io room management
- More broadcast events

---

## Monitoring & Observability

### Key Metrics to Track

```bash
Performance
├─ Message delivery latency (< 100ms p95)
├─ Unread count query time (< 50ms)
└─ Socket connection establishment (< 1s)

Business
├─ Active circles
├─ Message daily volume
├─ Member join/leave rates
└─ Circle discovery search queries

Infrastructure
├─ Database connection pool usage
├─ Socket.io room counts
├─ Redis adapter sync lag
└─ Error rates by type
```

---

## Conclusion

The Study Circle architecture balances real-time interactivity with scalability through:

- **Facade pattern** for service organization
- **Repository optimization** for database efficiency
- **Event-driven** WebSocket communication
- **Role-based** permission enforcement
- **Batch operations** for performance

Next sections provide implementation-level details for backend, frontend, and data flows.
