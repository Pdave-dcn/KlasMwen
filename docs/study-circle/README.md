# Study Circle Feature Documentation

**Last Updated**: March 30, 2026  
**Status**: Development  
**Version**: 1.0

---

## Overview

Study Circle is a real-time collaborative group communication feature that enables users to create, discover, and participate in study groups. It combines instant messaging, presence tracking, and member management into a unified platform for educational collaboration.

### What is a Study Circle?

A Study Circle (or "Circle") is an interactive group chat space where users can:

- **Communicate synchronously** via real-time messages with WebSocket delivery
- **Manage access** through public (discoverable) or private (invitation-only) circles
- **Control participation** with role-based member management (OWNER, MODERATOR, MEMBER)
- **Track activity** with unread message counts per circle
- **See presence** of active members in real-time
- **Organize ideas** with message history and search capabilities

---

## Key Features

### 1. Circle Discovery & Management

- **Create circles** - Users establish new public or private study groups
- **Join public circles** - Discover and join circles matching interests
- **Invite to private circles** - OWNER/MODERATOR can add specific users
- **Search & filter** - Full-text search, trending, new, and recommended circles
- **Leave anytime** - Users can exit circles they no longer need

### 2. Real-Time Messaging

- **Instant message delivery** - WebSocket-based message streaming
- **Message persistence** - All messages stored in PostgreSQL database
- **Message deletion** - Senders and admins can remove messages
- **Optimistic updates** - UI updates immediately, then confirms with server
- **Deduplication** - Prevents duplicate messages from network latency

### 3. Member Management

- **Role-based permissions** - OWNER > MODERATOR > MEMBER hierarchy
- **Add/remove members** - Control circle composition with permission checks
- **Mute members temporarily** - Silence noisy members (15, 60, 120, 480 min options)
- **Member list** - View all circles members with search capability
- **Presence tracking** - Dual-layer (viewing vs. app open)

### 4. Unread Tracking

- **Automatic counting** - Messages received while member is away marked unread
- **Batch optimization** - Single SQL query counts unread across all circles
- **Timestamp-based** - `lastReadAt` set on join prevents pre-join message flooding
- **Manual mark-as-read** - Members trigger update after viewing messages

### 5. Notifications & Presence

- **Presence counts** - See how many users actively viewing each circle
- **Member join/leave** - Real-time notifications when users enter/exit
- **Activity indicators** - Which circles have recent message activity
- **Discovery presence** - Presence counts broadcast to circle browsers

---

## Use Cases

### Student Study Groups

Students create private circles to coordinate study sessions, share notes, and discuss course materials. They use mute features to manage participation and OWNER role to maintain structure.

### Subject Communities

Public circles for specific topics (Math, Biology, History) where students discover peers with shared interests, ask questions, and build communities.

### School/Class Coordination

Official class circles facilitate teacher-student communication, assignment discussions, and peer learning within the same institution.

### Research Team Collaboration

Researchers use private circles for project-based communication, results discussion, and methodology debates with controlled membership.

### Hobby/Interest Groups

Users create public circles for shared hobbies (chess, coding, languages) to meet others and collaborate on projects.

---

## Architecture Highlights

### Full-Stack Integration

- **Backend**: Node.js/Express with Prisma ORM and PostgreSQL
- **Real-time**: Socket.io WebSocket for live message delivery
- **Frontend**: React with TypeScript, Zustand for state, React Query for server state
- **Communication**: REST APIs for commands, WebSocket for events

### Key Design Patterns

- **Facade Pattern**: CircleService delegates to specialized services
- **Repository Pattern**: Data access layer with optimized batch queries
- **Event-Driven**: Backend broadcasts events to Socket.io rooms
- **Optimistic Updates**: Frontend adds messages immediately, confirms later

### Performance Optimizations

- **Batch Unread Counting**: Single SQL LEFT JOIN query for all user's circles
- **Cursor-Based Pagination**: Efficient message loading using message IDs
- **Presence Discovery Rooms**: Separate Socket.io rooms prevent broadcast storms
- **Message Deduplication**: Client-side matching prevents duplicate rendering

---

## Data Model

### Core Entities

```bash
Circle (Study Group)
├── id (UUID)
├── name, description
├── isPrivate (boolean)
├── createdAt, creatorId
└── avatar (optional)

CircleMember (Participation)
├── userId, circleId (composite key)
├── role (OWNER | MODERATOR | MEMBER)
├── joinedAt, mutedUntil (optional)
└── lastReadAt (for unread tracking)

CircleMessage (Communication)
├── id (auto-increment)
├── content, circleId, senderId
├── createdAt
└── [indexed by circleId, createdAt]

CircleAvatar & CircleTag (Metadata)
```

---

## Permissions & RBAC

| Action                 | OWNER | MODERATOR | MEMBER |
| ---------------------- | ----- | --------- | ------ |
| **Circle Management**  |       |           |        |
| Create circle          | ✓     | ✗         | ✗      |
| Update circle info     | ✓     | ✗         | ✗      |
| Delete circle          | ✓     | ✗         | ✗      |
| **Member Management**  |       |           |        |
| Add members            | ✓     | ✓         | ✗      |
| Remove members         | ✓     | ✓         | ✗      |
| Update member role     | ✓     | ✗         | ✗      |
| Mute members           | ✓     | ✓\*       | ✗      |
| **Message Management** |       |           |        |
| Send messages          | ✓     | ✓         | ✓      |
| Delete any message     | ✓     | ✓         | Self   |
| **Participation**      |       |           |        |
| View members           | ✓     | ✓         | ✓      |
| Search members         | ✓     | ✓         | ✓      |
| Leave circle           | ✓     | ✓         | ✓      |

\*MODERATOR can mute MEMBER only

---

## File Structure

```bash
backend/
  src/
    features/circle/
      service/
        CircleService.ts              # Main facade
        core/
          CircleCoreService.ts        # CRUD operations
          CircleMemberService.ts      # Member management
          CircleMessageService.ts     # Messaging
          CircleValidationService.ts  # Validation logic
          CircleSearchService.ts      # Discovery & search
        Repositories/
          CircleRepository.ts         # Data access layer
    controllers/circle/
      circle.core.controller.ts       # Core endpoints
      circle.member.controller.ts     # Member endpoints
      circle.message.controller.ts    # Message endpoints
    socket/circles/
      circle.socket.ts               # Socket registration
      handlers/                       # Event handlers (6 types)
    security/
      rbac.js                         # Permission enforcement

frontend/
  src/
    features/circle/
      hub/
        components/                   # Discovery UI (31+ components)
        hooks/                        # Hub hooks
      room/
        components/                   # Chat interface (22+ components)
        hooks/                        # Room hooks
    stores/
      circle.store.ts                 # Zustand state
    queries/
      circle/circles.query.ts         # React Query hooks
    zodSchemas/
      circle.zod.ts                   # Validation schemas
```

---

## Getting Started

### For Backend Developers

1. Review [Backend Implementation Guide](./backend.md) for services, APIs, and database
2. Study [Data Flow Documentation](./data-flow.md) to understand message lifecycle
3. Check [Architecture Diagram](./architecture.md) for system relationships

### For Frontend Developers

1. Read [Frontend Implementation Guide](./frontend.md) for components and hooks
2. Understand real-time patterns in [Data Flow](./data-flow.md)
3. Review Zustand store and React Query integration

### For DevOps/Operations

1. Monitor database query performance (especially `countUnreadMessagesBatch`)
2. Configure Socket.io namespaces for production scaling
3. Set up alerts for cascade delete operations on circles

---

## Common Tasks

### Create a Study Circle

```typescript
POST /api/circles
{
  name: "Advanced Algebra Study Group",
  description: "Preparing for final exam",
  isPrivate: false,
  tagIds: ["math", "exam-prep"]
}
```

### Join a Public Circle

```typescript
POST /api/circles/:circleId/join
```

### Send a Message

```typescript
POST /api/circles/:circleId/messages
{
  content: "Has anyone solved problem 15?"
}
```

### Track Unread Messages

```typescript
// Backend automatically counts via lastReadAt
// Frontend displays count in circle list UI
```

### Mute a Member

```typescript
PATCH /api/circles/:circleId/members/:userId/mute
{
  duration: 60  // minutes
}
```

---

## Known Limitations

See [Known Limitations](./known-limitations.md) for current constraints, including:

- Message history limits
- Presence scaling considerations
- Search performance thresholds
- Socket.io connection limits

---

## Future Enhancements

See [Future Improvements](./future-improvements.md) for the roadmap, including:

- **P1**: Message reactions and threading
- **P2**: Voice/video call integration
- **P3**: Circle moderation tools
- **P4**: Advanced analytics and metrics

---

## Support

- **Documentation**: See full technical guides in this directory
- **Issues**: Report bugs with circle ID and timestamp for reproduction
- **Questions**: Refer to architecture diagrams in [Architecture Guide](./architecture.md)

---

## Technical Contacts

- **Backend Lead**: Define based on team
- **Frontend Lead**: Define based on team
- **DevOps**: Define based on team
