# Study Circle Backend Implementation

**Document Type**: Backend Developer Guide  
**Audience**: Backend engineers, API consumers  
**Last Updated**: March 30, 2026

---

## Service Layer Overview

### Entry Point: CircleService Facade

**File**: `backend/src/features/circle/service/CircleService.ts`

The CircleService is the main entry point that delegates to specialized services:

```typescript
export class CircleService {
  // Delegates to CircleCoreService
  static createCircle = CircleCoreService.createCircle;
  static joinCircle = CircleCoreService.joinCircle;
  static getUserCircles = CircleCoreService.getUserCircles;

  // Delegates to CircleMemberService
  static addMemberToCircle = CircleMemberService.addMemberToCircle;
  static removeMember = CircleMemberService.removeMember;

  // Delegates to CircleMessageService
  static sendMessage = CircleMessageService.sendMessage;

  // Delegates to CircleSearchService
  static discoverCircles = CircleSearchService.discoverCircles;

  // ... ~50+ total methods
}
```

### Service 1: CircleCoreService

**File**: `backend/src/features/circle/service/core/CircleCoreService.ts`

Handles core circle operations (CRUD, discovery, member listing).

#### Key Methods

| Method           | Signature                                                             | Purpose                                 | Returns                   |
| ---------------- | --------------------------------------------------------------------- | --------------------------------------- | ------------------------- |
| `createCircle`   | `(data: CreateCircleData, user: AuthUser) => Promise<Circle>`         | Create new circle with creator as OWNER | Circle with members array |
| `joinCircle`     | `(circleId: string, userId: string) => Promise<CircleMember>`         | User joins public circle                | Transformed CircleMember  |
| `leaveCircle`    | `(circleId: string, requester: AuthUser) => Promise<{ success }>`     | User leaves circle                      | Success response          |
| `getCircleById`  | `(circleId: string, userId?: string) => Promise<Circle>`              | Fetch full circle details               | Enriched Circle           |
| `getUserCircles` | `(userId: string, pagination) => Promise<Circle[]>`                   | Get user's circles ordered by activity  | Paginated circles         |
| `updateCircle`   | `(circleId: string, data: UpdateCircleData, user) => Promise<Circle>` | Update circle metadata                  | Updated circle            |
| `deleteCircle`   | `(circleId: string, user) => Promise<{ success }>`                    | Delete circle (cascades)                | Success response          |

#### Implementation Details

```typescript
// Example: joinCircle implementation
static async joinCircle(circleId: string, userId: string): Promise<CircleMember> {
  // Validate circle exists
  const circle = await CircleRepository.findCircleById(circleId);
  if (!circle) throw CircleNotFoundError();

  // Private circles cannot be self-joined
  if (circle.isPrivate) throw AuthorizationError("Cannot join private circle");

  // Delegate to unified member addition method
  return CircleMemberService.addMemberToCircle(
    userId,
    circleId,
    "MEMBER",
    undefined // no requester needed for public join
  );
}
```

---

### Service 2: CircleMemberService

**File**: `backend/src/features/circle/service/core/CircleMemberService.ts`

Handles all member-related operations and role-based permissions.

#### CircleMemberService Key Methods

| Method                | Signature                                                            | Purpose                     | Notes                                                      |
| --------------------- | -------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------- |
| `addMemberToCircle`   | `(userId, circleId, role?, requester?) => Promise<CircleMember>`     | **UNIFIED** member addition | Sets `lastReadAt: new Date()` to prevent old message flood |
| `removeMember`        | `(targetUserId, circleId, requester) => Promise<{ success }>`        | Remove user from circle     | Validates permissions                                      |
| `updateMemberRole`    | `(userId, circleId, data, requester) => Promise<CircleMember>`       | Change member's role        | OWNER only                                                 |
| `muteMember`          | `(actor, circleId, targetUserId, duration) => Promise<CircleMember>` | Temporary mute (15-480 min) | Hierarchical: OWNER > MODERATOR > MEMBER                   |
| `unmuteMember`        | `(actor, circleId, targetUserId) => Promise<CircleMember>`           | Clear mute                  | Returns to normal state                                    |
| `updateLastReadAt`    | `(userId, circleId, timestamp?) => Promise<CircleMember>`            | Update read tracking        | Called after viewing messages                              |
| `getCircleMembers`    | `(userId, circleId, pagination) => Promise<CircleMember[]>`          | List circle members         | Paginated with enrichment                                  |
| `searchCircleMembers` | `(circleId, query, pagination) => Promise<CircleMember[]>`           | Search by username          | Full-text indexed                                          |

#### Critical Implementation: Unified Member Addition

```typescript
static async addMemberToCircle(
  userId: string,
  circleId: string,
  role: CircleRole = "MEMBER",
  requester?: Express.User & { circleRole?: CircleRole }
): Promise<CircleMember> {
  // 1. Verify circle exists
  const circle = await CircleValidationService.verifyCircleExists(circleId);

  // 2. Check user not already member
  const isMember = await CircleValidationService.checkMembership(userId, circleId);
  if (isMember) throw AlreadyMemberError();

  // 3. Permission checks (different for public join vs admin add)
  if (circle.isPrivate || (requester && requester.id !== userId)) {
    if (requester) {
      assertCirclePermission(requester, "circleMembers", "add");
    }
  }

  // 4. Add member with lastReadAt set to NOW
  // KEY: This prevents pre-join messages from counting as unread
  const member = await CircleRepository.addMember(
    { userId, circleId, role },
    new Date()  // ← lastReadAt initialization
  );

  // 5. Return enriched + transformed member
  return CircleTransformers.transformMember(
    CircleEnricher.enrichMember(member)
  );
}
```

#### Authorization Levels (assertCirclePermission)

```typescript
// Resource: "circleMembers", Action: "add"
// OWNER: Can add anyone with any role
// MODERATOR: Can add with role MEMBER or MODERATOR (not OWNER)
// MEMBER: Cannot add

// Resource: "circleMembers", Action: "remove"
// OWNER: Can remove anyone
// MODERATOR: Can remove MEMBER and lower MODERATOR
// MEMBER: Cannot remove

// Resource: "circleMembers", Action: "update"
// OWNER: Can update any role
// MODERATOR: Cannot update roles
// MEMBER: Cannot update roles
```

---

### Service 3: CircleMessageService

**File**: `backend/src/features/circle/service/core/CircleMessageService.ts`

Manages message lifecycle: send, retrieve, delete.

#### CircleMessageService Key Methods

| Method             | Signature                                                  | Purpose                            | Emits Event          |
| ------------------ | ---------------------------------------------------------- | ---------------------------------- | -------------------- |
| `sendMessage`      | `(data: SendMessageData, user) => Promise<CircleMessage>`  | Create and broadcast message       | `circle:new_message` |
| `getMessages`      | `(circleId, user, pagination) => Promise<CircleMessage[]>` | Retrieve with cursor pagination    | None                 |
| `deleteMessage`    | `(messageId, requester) => Promise<{ success }>`           | Delete message (sender/admin only) | None                 |
| `getLatestMessage` | `(circleId) => Promise<CircleMessage \| null>`             | Most recent message                | None                 |

#### Message Sending Flow

```typescript
static async sendMessage(
  data: SendMessageData,
  user: AuthUser
): Promise<CircleMessage> {
  // 1. Validate membership
  const membership = await CircleValidationService.verifyMembership(
    user.id,
    data.circleId
  );

  // 2. Check mute status
  await CircleValidationService.ensureMemberNotMuted({
    userId: user.id,
    circleId: data.circleId,
    timestamp: new Date()
  });
  if (membership.mutedUntil && membership.mutedUntil > new Date()) {
    throw MemberMutedError("You are muted in this circle");
  }

  // 3. Create message in database
  const message = await CircleRepository.createMessage({
    content: data.content,
    circleId: data.circleId,
    senderId: user.id
  });

  // 4. Get Socket.io io instance and broadcast
  const io = getSocketIOInstance();
  io.to(`circle:${data.circleId}`).emit("circle:new_message", {
    ...message,
    sender: { id: user.id, username: user.username }
  });

  // 5. Return enriched message
  return CircleEnricher.enrichMessage(message);
}
```

---

### Service 4: CircleValidationService

**File**: `backend/src/features/circle/service/core/CircleValidationService.ts`

Centralized validation logic.

#### CircleValidationService Key Methods

```typescript
// Returns enriched circle or throws CircleNotFoundError
static async verifyCircleExists(circleId: string): Promise<Circle>

// Returns boolean (safe for conditional logic)
static async checkMembership(userId: string, circleId: string): Promise<boolean>

// Returns membership record or throws NotAMemberError
static async verifyMembership(userId: string, circleId: string): Promise<CircleMember>

// Throws if not member
static async verifyIsMember(userId: string, circleId: string): Promise<void>

// Throws CircleNotFoundError if missing
static async verifyMessageExists(messageId: string): Promise<CircleMessage>

// Throws MemberMutedError if muted
static async ensureMemberNotMuted(data: { userId, circleId, timestamp }): Promise<void>
```

---

### Service 5: CircleSearchService

**File**: `backend/src/features/circle/service/core/CircleSearchService.ts`

Discovery, search, and recommendations.

#### CircleSearchService Key Methods

| Method                                | Purpose                      | Query Type |
| ------------------------------------- | ---------------------------- | ---------- |
| `discoverCircles(userId, pagination)` | Public circles user not in   | Paginated  |
| `getRecommendedCircles(userId)`       | Based on member overlap      | Top 10     |
| `getTrendingCircles()`                | Most messages in 7 days      | Top 10     |
| `getNewCircles()`                     | Recently created             | Top 10     |
| `getSmallCircles()`                   | < 5 members (easier to join) | Top 10     |
| `getSimilarCircles(circleId)`         | By shared tags               | Top 10     |
| `searchCircles(query, pagination)`    | Full-text search             | Paginated  |
| `getSearchSuggestions(query)`         | Auto-complete                | Top 5      |

---

## Repository Layer (Data Access)

**File**: `backend/src/features/circle/service/Repositories/CircleRepository.ts`

Optimized database queries using Prisma.

### Circle Queries

```typescript
// Get circle by ID with members and latest message
static async findCircleById(
  circleId: string
): Promise<Circle | null>

// Get all public circles user isn't in
static async findPublicCircles(
  userId: string,
  skip: number,
  take: number
): Promise<Circle[]>

// Get user's circles ordered by last message date
static async findUserCircles(
  userId: string,
  skip: number,
  take: number
): Promise<Circle[]>

// Create circle with creator as OWNER
static async createCircle(
  data: CreateCircleData & { creatorId: string }
): Promise<Circle>
// Implementation:
// 1. Create Circle record
// 2. Auto-create CircleMember with role=OWNER, lastReadAt=NOW
// 3. Return populated circle

// Update circle metadata
static async updateCircle(
  circleId: string,
  data: UpdateCircleData
): Promise<Circle>

// Delete circle (cascades to members & messages)
static async deleteCircle(circleId: string): Promise<{ success: boolean }>
```

### Member Operations

```typescript
// Add member with optional lastReadAt
static async addMember(
  data: JoinCircleData,        // { userId, circleId, role }
  lastReadAt?: Date
): Promise<CircleMember>
// Sets: lastReadAt ?? null (if null, defaults to epoch in queries)

// Remove member
static async removeMember(userId: string, circleId: string): Promise<void>

// Update member's role
static async updateMemberRole(
  userId: string,
  circleId: string,
  data: { role: CircleRole }
): Promise<CircleMember>

// Set member mute
static async setMemberMute(
  userId: string,
  circleId: string,
  mutedUntil: Date | null
): Promise<CircleMember>

// Get paginated member list
static async getGroupMembers(
  circleId: string,
  skip: number,
  take: number
): Promise<CircleMember[]>

// Search members by username (full-text)
static async searchMembers(
  circleId: string,
  query: string,
  skip: number,
  take: number
): Promise<CircleMember[]>

// Update read timestamp
static async updateLastReadAt(
  userId: string,
  circleId: string,
  timestamp: Date
): Promise<CircleMember>
```

### Critical: Unread Message Counting

```typescript
// Single circle unread count
static async countUnreadMessages(
  circleId: string,
  userId: string,
  lastReadAt?: Date
): Promise<number> {
  return prisma.circleMessage.count({
    where: {
      circleId,
      createdAt: {
        gt: lastReadAt ?? new Date("1970-01-01")
      },
      senderId: { not: userId }  // Exclude own messages
    }
  });
}

// OPTIMIZED: Batch count for all user's circles (single query)
static async countUnreadMessagesBatch(userId: string): Promise<Map<string, number>> {
  const result = await prisma.$queryRaw`
    SELECT
      m.circleId,
      COUNT(*) as unread_count
    FROM CircleMessage m
    LEFT JOIN CircleMember cm
      ON cm.circleId = m.circleId
      AND cm.userId = ${userId}
    WHERE m.circleId IN (
      SELECT DISTINCT circleId
      FROM CircleMember
      WHERE userId = ${userId}
    )
    AND m.createdAt > COALESCE(cm.lastReadAt, '1970-01-01')
    AND m.senderId != ${userId}
    GROUP BY m.circleId
  `;

  return new Map(result.map(r => [r.circleId, r.unread_count]));
}
```

### Message Operations

```typescript
// Create message
static async createMessage(
  data: { content: string; circleId: string; senderId: string }
): Promise<CircleMessage>

// Get messages with cursor pagination
static async findMessages(
  circleId: string,
  cursor?: string,
  take: number = 20
): Promise<CircleMessage[]>

// Get single message
static async findMessageById(messageId: string): Promise<CircleMessage | null>

// Delete message
static async deleteMessage(messageId: string): Promise<void>
```

---

## Database Schema

**File**: `backend/prisma/schema.prisma` (lines 242-315)

### Circle Model

```prisma
model Circle {
  id          String          @id @default(uuid())
  name        String
  description String?
  isPrivate   Boolean         @default(false)
  createdAt   DateTime        @default(now())

  creator     User            @relation("circleCreator", fields: [creatorId], references: [id])
  creatorId   String

  avatar      CircleAvatar?   @relation(fields: [avatarId], references: [id])
  avatarId    Int?

  members     CircleMember[]  @relation(onDelete: Cascade)
  messages    CircleMessage[] @relation(onDelete: Cascade)
  circleTags  CircleTag[]     @relation(onDelete: Cascade)

  @@index([creatorId])
}
```

### CircleMember Model

```prisma
model CircleMember {
  userId      String
  circleId    String
  role        CircleRole      @default(MEMBER)
  joinedAt    DateTime        @default(now())
  mutedUntil  DateTime?       // Temporary mute expiration
  lastReadAt  DateTime?       // Key for unread tracking

  user        User            @relation(fields: [userId], references: [id])
  circle      Circle          @relation(fields: [circleId], references: [id], onDelete: Cascade)

  @@id([userId, circleId])
  @@index([circleId])
}

enum CircleRole {
  OWNER
  MODERATOR
  MEMBER
}
```

### CircleMessage Model

```prisma
model CircleMessage {
  id        Int             @id @default(autoincrement())
  content   String
  circleId  String
  senderId  String
  createdAt DateTime        @default(now())

  sender    User            @relation(fields: [senderId], references: [id])
  circle    Circle          @relation(fields: [circleId], references: [id], onDelete: Cascade)

  @@index([circleId, createdAt])  // For message retrieval
}
```

### CircleAvatar Model

```prisma
model CircleAvatar {
  id      Int       @id @default(autoincrement())
  url     String    @unique
  circles Circle[]
}
```

### CircleTag Model

```prisma
model CircleTag {
  circleId  String
  tagId     String

  circle    Circle  @relation(fields: [circleId], references: [id], onDelete: Cascade)
  tag       Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([circleId, tagId])
}
```

---

## REST API Endpoints

### Core Circle Routes

**Base URL**: `/api/circles`

| Method   | Endpoint             | Purpose                 | Auth             |
| -------- | -------------------- | ----------------------- | ---------------- |
| `POST`   | `/`                  | Create circle           | Required         |
| `GET`    | `/`                  | Get user's circles      | Required         |
| `GET`    | `/recent-activity`   | Circles by activity     | Required         |
| `GET`    | `/avatars`           | Get avatar options      | Optional         |
| `POST`   | `/:circleId/join`    | Join public circle      | Required         |
| `GET`    | `/:circleId/preview` | Circle preview          | Optional         |
| `POST`   | `/:circleId/leave`   | Leave circle            | Required         |
| `GET`    | `/:circleId`         | Get full circle details | Required         |
| `PUT`    | `/:circleId`         | Update circle           | Required (OWNER) |
| `DELETE` | `/:circleId`         | Delete circle           | Required (OWNER) |

### Member Routes

**Base URL**: `/api/circles/:circleId/members`

| Method   | Endpoint        | Purpose           | Auth                 |
| -------- | --------------- | ----------------- | -------------------- |
| `POST`   | `/`             | Add member        | Required (OWNER/MOD) |
| `GET`    | `/`             | List members      | Required (MEMBER)    |
| `GET`    | `/muted`        | Get muted members | Required (OWNER/MOD) |
| `GET`    | `/search`       | Search members    | Required (MEMBER)    |
| `DELETE` | `/:userId`      | Remove member     | Required (OWNER/MOD) |
| `PATCH`  | `/:userId`      | Update role       | Required (OWNER)     |
| `PATCH`  | `/:userId/mute` | Mute member       | Required (OWNER/MOD) |
| `POST`   | `/me/read`      | Mark as read      | Required (MEMBER)    |

### Message Routes

**Base URL**: `/api/circles/:circleId/messages`

| Method   | Endpoint      | Purpose        | Auth                         |
| -------- | ------------- | -------------- | ---------------------------- |
| `POST`   | `/`           | Send message   | Required (MEMBER, not muted) |
| `GET`    | `/`           | Get messages   | Required (MEMBER)            |
| `DELETE` | `/:messageId` | Delete message | Required (sender/OWNER)      |

### Request/Response Examples

#### Create Circle

```bash
POST /api/circles
{
  "name": "Advanced Algorithms",
  "description": "Preparing for ICPC",
  "isPrivate": false,
  "tagIds": ["programming", "algorithms"]
}

Response 201:
{
  "id": "circle-123",
  "name": "Advanced Algorithms",
  "creator": { "id": "user-1", "username": "pqr", ...},
  "members": [{ "userId": "user-1", "role": "OWNER", "lastReadAt": "2026-03-30T..." }],
  "memberCount": 1,
  "unreadCount": 0
}
```

#### Join Public Circle

```bash
POST /api/circles/circle-123/join

Response 201:
{
  "userId": "user-2",
  "circleId": "circle-123",
  "role": "MEMBER",
  "joinedAt": "2026-03-30T...",
  "lastReadAt": "2026-03-30T..."  ← NEW: Set to NOW
}
```

#### Send Message

```bash
POST /api/circles/circle-123/messages
{
  "content": "We need a new implementation strategy"
}

Response 201:
{
  "id": 42,
  "content": "We need a new implementation strategy",
  "circleId": "circle-123",
  "sender": { "id": "user-2", "username": "abc", ...},
  "createdAt": "2026-03-30T..."
}
```

#### Get Unread Counts (via batch endpoint, if implemented)

```bash
GET /api/circles/unread-counts

Response 200:
{
  "circle-123": 3,
  "circle-45": 0,
  "circle-67": 5
}
```

---

## Socket.io Events

**Namespace**: `/circles` (WebSocket)

### Emitted Events (Server → Client)

#### `circle:new_message`

```typescript
// Broadcast to: io.to(`circle:${circleId}`)
{
  id: 42,
  content: "Message content",
  circleId: "circle-123",
  sender: { id: "user-2", username: "abc", avatarUrl: "..." },
  createdAt: "2026-03-30T..."
}
```

#### `circle:member_joined`

```typescript
// Broadcast to: io.to(`circle:${circleId}`).except(joinerSocketId)
{
  user: {
    id: "user-2",
    username: "abc"
  }
}
```

#### `circle:member_left`

```typescript
// Broadcast to: io.to(`circle:${circleId}`)
{
  user: {
    id: "user-2",
    username: "abc"
  }
}
```

#### `circle:presence_counts_update`

```typescript
// Sent to discovery watchers
{
  counts: {
    "circle-123": 3,
    "circle-45": 1,
    "circle-67": 5
  }
}
```

### Received Events (Client → Server)

#### `circle:join_room`

```typescript
socket.emit("circle:join_room", { circleId: "circle-123" }, (response) => {
  if (response.success) {
    console.log("Members present:", response.presentMemberIds);
  }
});
```

#### `circle:leave_room`

```typescript
socket.emit("circle:leave_room", { circleId: "circle-123" }, (response) => {
  // { success: boolean }
});
```

---

## Error Handling

### Custom Error Classes

**File**: `backend/src/core/error/custom/circle.error.ts`

```typescript
class CircleError extends BaseError {}

class CircleNotFoundError extends CircleError {
  constructor() {
    super("Circle not found", 404);
  }
}

class NotAMemberError extends CircleError {
  constructor() {
    super("You are not a member of this circle", 403);
  }
}

class AlreadyMemberError extends CircleError {
  constructor() {
    super("You are already a member of this circle", 409);
  }
}

class AuthorizationError extends CircleError {
  constructor(message = "Insufficient permissions") {
    super(message, 403);
  }
}

class MessageNotFoundError extends CircleError {
  constructor() {
    super("Message not found", 404);
  }
}

class MemberMutedError extends CircleError {
  constructor(message = "You are muted in this circle") {
    super(message, 403);
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "NOT_A_MEMBER",
    "message": "You are not a member of this circle",
    "statusCode": 403
  }
}
```

---

## Testing

### Service Tests

**File**: `backend/tests/features/circle/service/core/CircleCoreService.test.ts`

Key test scenarios:

- Create circle (sets creator as OWNER)
- Join public circle (succeeds)
- Join private circle (fails with AuthorizationError)
- Leave circle (updates membership)
- Get user's circles (ordered by activity)

### Repository Tests

**File**: `backend/tests/features/circle/service/Repositories/CircleRepository.test.ts`

Key scenarios:

- Batch unread counting (compares to individual counts)
- Cursor-based message pagination
- Member search with full-text

### Socket Integration Tests

**File**: `backend/tests/socket/circles/handlers/`

- joinCircleHandler (room join, presence broadcast)
- sendMessageHandler (message delivery, deduplication)

---

## Best Practices

### 1. Always Use Unified Member Addition

Don't add members directly via repository. Always use:

```typescript
CircleMemberService.addMemberToCircle(userId, circleId, role, requester);
```

### 2. Check Mute Before Sending

```typescript
if (member.mutedUntil && member.mutedUntil > new Date()) {
  throw MemberMutedError();
}
```

### 3. Use Batch Unread Counting

For UI displaying multiple circles' unread counts:

```typescript
const unreads = await CircleRepository.countUnreadMessagesBatch(userId);
// Returns Map<circleId, unreadCount>
```

### 4. Validate membership, then permissions

```typescript
const member = await CircleValidationService.verifyMembership(userId, circleId);
assertCirclePermission(requester, "resource", "action");
```

### 5. Broadcast Socket Events After DB Write

```typescript
const message = await CircleRepository.createMessage(data);
io.to(`circle:${circleId}`).emit("circle:new_message", message);
```

---

## Performance Considerations

| Operation         | Time   | Notes                            |
| ----------------- | ------ | -------------------------------- |
| Create circle     | ~10ms  | Auto-adds creator, 2 DB writes   |
| Get unread counts | ~50ms  | Batch query, single DB hit       |
| Send message      | ~20ms  | 1 DB write + Socket.io broadcast |
| Get messages page | ~30ms  | Indexed cursor query             |
| Search members    | ~100ms | Full-text index scaled           |

---

## Deployment Checklist

- [ ] Database indexes created: `(Circle.creatorId)`, `(CircleMessage.circleId, createdAt)`
- [ ] Socket.io Redis adapter configured (for multi-server)
- [ ] Rate limiting enabled on message endpoint (prevent spam)
- [ ] Environment variables set (JWT secret, Socket.io origin)
- [ ] Database backups configured
- [ ] Monitoring alerts set for error rates
