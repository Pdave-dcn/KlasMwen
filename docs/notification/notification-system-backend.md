# Notification System

**Document Type**: Backend Developer Guide  
**Last Updated**: May 29, 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Data Model](#2-data-model)
3. [Architecture & Data Flow](#3-architecture--data-flow)
4. [Event-Driven Path](#4-event-driven-path)
5. [REST API](#5-rest-api)
6. [Real-Time Delivery](#6-real-time-delivery)
7. [Service Layer Reference](#7-service-layer-reference)
8. [Rate Limiting](#8-rate-limiting)
9. [Wiring & Bootstrap](#9-wiring--bootstrap)
10. [Testing](#10-testing)

---

## 1. Overview

The notification system delivers in-app alerts for social interactions (likes, comments, replies) and administrative actions (report updates). It uses an **event-driven architecture** on the write path — services emit domain events via a shared `EventBus`, and a dedicated event handler subscribes, translates events into notifications, persists them, and pushes real-time delivery via Socket.IO.

**Key design decisions:**

- **Decoupled event path**: Like/comment services never import `NotificationService`. They emit typed domain events. The notification system reacts independently.
- **Self-notification guards**: Skipped in the event handler, not in the command service — each notification type decides its own skip logic.
- **Lazy Socket.IO injection**: `NotificationEmitter` receives `io` after app bootstrap via `initialize(io)`, avoiding circular dependency issues.
- **Pure composition facade**: `NotificationService` is a bag of `readonly query` and `readonly command` sub-services.

---

## 2. Data Model

### Prisma Enum

```prisma
enum NotificationType {
  COMMENT_ON_POST  // Root comment on user's post
  REPLY_TO_COMMENT // Reply to user's comment
  LIKE             // Like on user's post
  REPORT_UPDATE    // Report status change (not yet wired)
}
```

### Prisma Model

```prisma
model Notification {
  id        Int              @id @default(autoincrement())
  type      NotificationType
  read      Boolean          @default(false)
  createdAt DateTime         @default(now()) @map("created_at")

  user    User   @relation("notificationReceiver", fields: [userId], references: [id])
  userId  String @map("user_id")       // Receiver
  actor   User   @relation("notificationActor", fields: [actorId], references: [id])
  actorId String @map("actor_id")      // Triggerer

  post    Post?    @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId  String?  @map("post_id")
  comment Comment? @relation(fields: [commentId], references: [id], onDelete: Cascade)
  commentId Int?   @map("comment_id")

  @@map("notifications")
}
```

### Notification → NotificationType Mapping

| Domain Event              | Notification Type  | Receiver              | Context               |
| ------------------------- | ------------------ | --------------------- | --------------------- |
| `post:liked`              | `LIKE`             | Post author           | `postId`              |
| `comment:created` (root)  | `COMMENT_ON_POST`  | Post author           | `postId`, `commentId` |
| `comment:created` (reply) | `REPLY_TO_COMMENT` | Parent comment author | `postId`, `commentId` |
| _(not wired)_             | `REPORT_UPDATE`    | Reported user         | —                     |

---

## 3. Architecture & Data Flow

```bash
┌─────────────────────────────────────────────────────────────────┐
│                      REST / Socket.IO Client                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│  Routes (notification.route.ts)                                  │
│  ├─ attachLogContext("notificationController")                   │
│  ├─ generalApiLimiter                                            │
│  ├─ requireAuth (JWT)                                            │
│  └─ per-route rate-limiter (read 100/15min | write 50/hour)     │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│  Controller (notification.controller.ts)                         │
│  ├─ Zod validation: params, query                                │
│  ├─ Delegates to notificationService.query / .command            │
│  └─ Returns standardized JSON responses                          │
└──────┬───────────────────────────────────────┬──────────────────┘
       │                                       │
       ▼                                       ▼
┌──────────────┐                  ┌──────────────────────────┐
│ Query Path   │                  │  Command Path             │
│              │                  │                           │
│ Notification │                  │ Notification              │
│ QueryService  │                  │ CommandService             │
│   └─ Repo    │                  │   ├─ PermissionService     │
│      └─ Prisma│                  │   └─ Repo                 │
│               │                  │      └─ Prisma            │
└──────────────┘                  │   ┌─ NotificationEmitter   │
                                  │   │   └─ Socket.IO push    │
                                  └───┴───────────────────────┘

  Event-Driven Path (Write):

  Like/Comment Service
       │
       ▼
  eventBus.emit(event)
       │
       ▼
  NotificationEventHandler (subscriber)
       ├─ Self-notification guard
       └─ notificationService.command.createNotification()
              │
              ▼
       NotificationCommandService.createNotification()
              ├─ NotificationRepository → Prisma INSERT
              └─ NotificationEmitter.emit("notification:new", ...)
                     │
                     ▼
              Socket.IO → user:{userId} room
```

### Local File Map

```bash
backend/src/
├── core/events/
│   ├── EventBus.ts           # Singleton EventEmitter wrapper
│   └── types.ts              # Domain event type definitions
├── features/notification/
│   └── service/
│       ├── index.ts                               # Barrel (service, emitter, types)
│       ├── NotificationService.ts                 # Pure composition facade
│       ├── types/NotificationTypes.ts             # Prisma select fragments, DTOs
│       ├── core/
│       │   ├── NotificationCommandService.ts      # Write business logic + socket emit
│       │   ├── NotificationQueryService.ts        # Read business logic + pagination
│       │   └── NotificationEmitter.ts             # Lazy Socket.IO adapter
│       ├── repo/
│       │   ├── NotificationRepository.ts          # Facade delegating to core repos
│       │   └── core/
│       │       ├── NotificationCommandRepository.ts  # Prisma writes
│       │       └── NotificationQueryRepository.ts    # Prisma reads
│       └── listeners/
│           ├── index.ts                           # Barrel
│           └── NotificationEventHandler.ts        # Event bus subscriber
├── controllers/notification.controller.ts
├── routes/notification.route.ts
├── middleware/coreRateLimits.middleware.ts         # notificationReadLimiter, notificationWriteLimiter
├── zodSchemas/notification.zod.ts
└── app.ts                                         # Wiring: emitter.init + handler.register
```

---

## 4. Event-Driven Path

### EventBus

**File**: `backend/src/core/events/EventBus.ts`

A lightweight synchronous in-process event bus built on Node's `EventEmitter`. Singleton with a max of 20 listeners.

```typescript
import { eventBus } from "@/core/events/EventBus.js";

// Emit
eventBus.emit<PostLikedEvent>({
  type: "post:liked",
  postId,
  postAuthorId,
  actorId,
});

// Subscribe
eventBus.on<PostLikedEvent>("post:liked", handler);
```

### Domain Events

**File**: `backend/src/core/events/types.ts`

| Event                   | Payload Fields                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| `post:liked`            | `postId`, `postAuthorId`, `actorId`                                                          |
| `comment:created`       | `commentId`, `postId`, `postAuthorId`, `commentAuthorId`, `parentCommentAuthorId`, `isReply` |
| `report:status_updated` | `reportId`, `reportedUserId`, `updatedBy`, `newStatus`                                       |

### NotificationEventHandler

**File**: `backend/src/features/notification/service/listeners/NotificationEventHandler.ts`

Subscribes to domain events and translates them into notification creation. Guards against self-notifications.

| Event                     | Handler                | Notification Created                           | Self-Skip Condition                         |
| ------------------------- | ---------------------- | ---------------------------------------------- | ------------------------------------------- |
| `post:liked`              | `handlePostLiked`      | `LIKE` for `postAuthorId`                      | `postAuthorId === actorId`                  |
| `comment:created` (root)  | `handleCommentCreated` | `COMMENT_ON_POST` for `postAuthorId`           | `commentAuthorId === postAuthorId`          |
| `comment:created` (reply) | `handleCommentCreated` | `REPLY_TO_COMMENT` for `parentCommentAuthorId` | `commentAuthorId === parentCommentAuthorId` |

---

## 5. REST API

All endpoints are mounted at `/api/notifications` and require authentication. Full OpenAPI 3.0 documentation is inlined as JSDoc on the route file.

### Endpoint Summary

| Method | Path        | Handler                      | Rate Limiter               | Description                                        |
| ------ | ----------- | ---------------------------- | -------------------------- | -------------------------------------------------- |
| GET    | `/`         | `getNotifications`           | `notificationReadLimiter`  | Paginated list with optional `read`/`type` filters |
| PATCH  | `/:id/read` | `markNotificationAsRead`     | `notificationWriteLimiter` | Mark one notification as read                      |
| PATCH  | `/read-all` | `markAllNotificationsAsRead` | `notificationWriteLimiter` | Mark all as read                                   |
| DELETE | `/all`      | `deleteAllNotifications`     | `notificationWriteLimiter` | Delete all notifications                           |
| DELETE | `/read`     | `deleteReadNotifications`    | `notificationWriteLimiter` | Delete only read notifications                     |
| DELETE | `/:id`      | `deleteNotification`         | `notificationWriteLimiter` | Delete one notification                            |

### GET `/` — Get Notifications

**Query Parameters:**

| Param    | Type                  | Default | Description                             |
| -------- | --------------------- | ------- | --------------------------------------- |
| `limit`  | integer (1–50)        | 10      | Number per page                         |
| `cursor` | integer               | —       | Cursor (notification ID) for pagination |
| `read`   | `"true"` \| `"false"` | —       | Filter by read status                   |
| `type`   | `NotificationType`    | —       | Filter by notification type             |

**Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "type": "LIKE",
      "read": false,
      "createdAt": "2026-05-29T12:00:00.000Z",
      "actor": { "id": "uuid", "username": "john", "avatarUrl": "..." },
      "post": { "id": "uuid", "title": "My Post", "slug": "my-post" },
      "comment": null
    }
  ],
  "pagination": { "nextCursor": 50, "hasMore": true },
  "unreadCount": 3
}
```

### PATCH `/:id/read` — Mark as Read

**Path:** `id` — notification ID (integer)

**Response (200):** `{ "message": "Notification marked as read" }`

### PATCH `/read-all` — Mark All as Read

**Response (200):** `{ "message": "All notifications marked as read" }`

### DELETE `/all` — Delete All

**Response (200):** `{ "message": "All notifications deleted successfully" }`

### DELETE `/read` — Delete Read

**Response (200):** `{ "message": "Read notifications deleted successfully" }`

### DELETE `/:id` — Delete One

**Response (200):** `{ "message": "Notification deleted successfully" }`

**Errors:** 400 (invalid ID), 403 (not owner), 404 (not found)

---

## 6. Real-Time Delivery

### NotificationEmitter

**File**: `backend/src/features/notification/service/core/NotificationEmitter.ts`

A Socket.IO adapter that holds a reference to the server instance and emits notification events to user-specific rooms (`user:{userId}`).

```typescript
// Initialized once in app.ts after socket creation:
notificationEmitter.initialize(io);

// Emit to a specific user's room:
notificationEmitter.emit(userId, "notification:new", payload);
```

The emitter is **gracefully no-op** before `initialize()` is called — it checks `this.io !== null` before emitting. Consumer code never needs a guard.

### Client-Side Socket Event

When a notification is created, the server emits to `user:{userId}` room:

- **Event name**: `notification:new`
- **Payload**: The full notification object with actor, post, and comment relations.

Clients should subscribe to `notification:new` to update the UI in real time.

---

## 7. Service Layer Reference

### NotificationService (Facade)

**File**: `backend/src/features/notification/service/NotificationService.ts`

```typescript
class NotificationService {
  readonly query: NotificationQueryService;
  readonly command: NotificationCommandService;
}
```

Singleton: `notificationService`

### NotificationQueryService

| Method                 | Signature                             | Returns                             |
| ---------------------- | ------------------------------------- | ----------------------------------- |
| `getUserNotifications` | `(userId, limit?, cursor?, filters?)` | `{ data, pagination, unreadCount }` |
| `getUnreadCount`       | `(userId)`                            | `number`                            |
| `getNotificationById`  | `(notificationId)`                    | `NotificationWithRelations \| null` |

### NotificationCommandService

| Method                    | Signature                        | Notes                                               |
| ------------------------- | -------------------------------- | --------------------------------------------------- |
| `createNotification`      | `(data: CreateNotificationData)` | Calls repo + emits `notification:new` via Socket.IO |
| `markAsRead`              | `(notificationId, user)`         | RBAC: asserts ownership                             |
| `markAllAsRead`           | `(userId)`                       | Bulk update                                         |
| `deleteNotification`      | `(notificationId, user)`         | RBAC: asserts ownership                             |
| `deleteAllNotifications`  | `(userId)`                       | Bulk delete                                         |
| `deleteReadNotifications` | `(userId)`                       | Deletes only `read = true`                          |

### NotificationRepository (Facade)

**File**: `backend/src/features/notification/service/repo/NotificationRepository.ts`

Static-method facade that delegates to `NotificationCommandRepository` and `NotificationQueryRepository`. Provides a single import for consumers that need both reads and writes.

### Core Repositories

**`NotificationCommandRepository`**: Pure Prisma writes — `create`, `markAsRead`, `markAllAsRead`, `delete`, `deleteAll`, `deleteRead`.

**`NotificationQueryRepository`**: Pure Prisma reads — `findUserNotifications` (cursor-paginated), `countUnread`, `countTotal`, `findById`, `exists`.

---

## 8. Rate Limiting

| Limiter                    | Endpoints        | Window     | Max Requests |
| -------------------------- | ---------------- | ---------- | ------------ |
| `notificationReadLimiter`  | `GET /`          | 15 minutes | 100          |
| `notificationWriteLimiter` | All PATCH/DELETE | 1 hour     | 50           |

Both skip failed requests and respond with 429 when exceeded.

---

## 9. Wiring & Bootstrap

In `backend/src/app.ts`:

```typescript
// After creating Socket.IO server:
notificationEmitter.initialize(io);
notificationEventHandler.register();
```

This must happen **after** `io` is created but **before** the server listens. The order is:

1. Create Express app and Socket.IO server
2. Wire routes, middleware, error handlers
3. `notificationEmitter.initialize(io)` — inject IO reference
4. `notificationEventHandler.register()` — subscribe to `eventBus`
5. `server.listen(PORT)`

---

## 10. Testing

### Test Files

| File                                                           | Tests | What It Covers                                         |
| -------------------------------------------------------------- | ----- | ------------------------------------------------------ |
| `tests/core/events/EventBus.test.ts`                           | 10    | EventBus emit/on/off, max listeners, cleanup           |
| `tests/features/notification/NotificationEmitter.test.ts`      | 7     | Emit before/after init, ready state, no-op guard       |
| `tests/features/notification/NotificationEventHandler.test.ts` | 9     | Business rules: self-skip for likes, comments, replies |
| `tests/controllers/notification.controller.test.ts`            | 11    | HTTP handlers: pagination, validation, errors          |

### Mocking Strategy

All notification tests use manual mocking — no test database.

- Prisma calls: `vi.mocked(prisma.notification.create).mockResolvedValue(...)`
- EventBus: `vi.spyOn(eventBus, "on")` / `vi.spyOn(eventBus, "emit")`
- NotificationEmitter: `vi.spyOn(notificationEmitter, "emit")`
- Socket.IO: No real server; mock the `to().emit()` chain

### Writing New Tests

Existing patterns:

- EventBus: Create listener, emit, assert listener called
- EventHandler: Create event, call handler directly, assert `notificationService.command.createNotification` was/wasn't called
- Controller: Mock `notificationService`, create mock `req`/`res`/`next`, assert response

---

## Appendix: Adding a New Notification Type

1. **Add enum value** to `NotificationType` in `prisma/schema.prisma` → run `npx prisma generate`
2. **Define domain event** in `core/events/types.ts` (if new interaction)
3. **Add handler** in `NotificationEventHandler.ts` — subscribe to event, create notification
4. **Wire emitter** (if domain service doesn't already emit): call `eventBus.emit(event)` in the service
5. **Update API docs** in `notification.route.ts` — add new type to `type` param enum
6. **Add tests** for the new handler in `NotificationEventHandler.test.ts`
