# Study Circle Future Improvements & Roadmap

**Document Type**: Product & Technical Roadmap  
**Audience**: Product managers, senior engineers, planning teams  
**Last Updated**: March 30, 2026  
**Planning Horizon**: 2026-2027 (18 months)

---

## Overview

This document outlines the prioritized feature roadmap for Study Circle. Priorities are based on user feedback, technical debt, scalability needs, and business alignment.

---

## Priority 1 (P1) - Critical for Growth

### P1.1: Push Notifications

**Status**: Not started  
**User Impact**: HIGH - 60% of users want  
**Business Impact**: Increases engagement 40-60%  
**Complexity**: Medium  
**Estimated Effort**: 2-3 weeks

**Description**:
Notify users of new messages via mobile push notifications. First notification on new message, then batch per 5 minutes.

**Technical Approach**:

1. Add `pushTokens` to User model
2. Implement FCM (Firebase Cloud Messaging) integration
3. Service for batching notifications (handle mutes)
4. Frontend: Request permission, store token

**Database Changes**:

```prisma
model User {
  pushTokens    String[]  // ["fcm:token1", "fcm:token2"]
  notifyMuted   Boolean   @default(false)
}
```

**API Endpoint**:

```bash
POST /api/notifications/register-token
{ token: "fcm:...", platform: "ios|android" }
```

**Socket Trigger** (when message sent):

```typescript
if (!message.sender.notifyMuted) {
  const memberTokens = await NotificationService.getTokensForCircle(circleId);
  await FCM.sendBatch({
    tokens: memberTokens,
    title: circle.name,
    body: message.content,
    data: { circleId, messageId },
  });
}
```

**Benefits**:

- Users don't miss important study sessions
- Increases daily active users
- Competitive with Slack/Discord

**Dependencies**: FCM setup, notification infrastructure

---

### P1.2: Message Reactions

**Status**: Designed (not implemented)  
**User Impact**: MEDIUM-HIGH - 50% of users want  
**Business Impact**: Increases engagement, better feedback  
**Complexity**: Medium  
**Estimated Effort**: 2 weeks

**Description**:
Add emoji reactions to messages (like Slack reactions). Click emoji under message to react.

**Technical Approach**:

1. Create `MessageReaction` table
2. Socket event when reaction added/removed
3. UI component for emoji picker
4. Deduplicate reactions from self

**Database Schema**:

```prisma
model MessageReaction {
  id              String    @id @default(uuid())
  messageId       Int       @db.Integer
  userId          String
  emoji           String    // "👍", "❤️", etc.
  createdAt       DateTime  @default(now())

  message         CircleMessage @relation(fields: [messageId])
  user            User      @relation(fields: [userId])

  @@unique([messageId, userId, emoji])  // 1 emoji per user per message
  @@index([messageId])
}
```

**API Endpoint**:

```bash
POST /api/circles/:circleId/messages/:messageId/reactions
{ emoji: "👍" }

DELETE /api/circles/:circleId/messages/:messageId/reactions/:emoji
```

**Socket Event**:

```typescript
socket.emit("circle:message_reacted", {
  messageId: 42,
  userId: "user-2",
  emoji: "👍",
  action: "add" | "remove",
});
```

**Frontend Component**:

```typescript
<MessageReactions
  messageId={42}
  reactions={[
    { emoji: "👍", count: 3, userReacted: true },
    { emoji: "❤️", count: 1, userReacted: false }
  ]}
  onAdd={(emoji) => addReaction(emoji)}
  onRemove={(emoji) => removeReaction(emoji)}
/>
```

**Benefits**:

- Rich feedback without text replies
- Reduces noise (not every message needs response)
- Familiar UX from Slack/Discord

---

### P1.3: Message Editing

**Status**: Analyzed, design incomplete  
**User Impact**: MEDIUM - 40% of users want  
**Business Impact**: Reduces confusion from typos  
**Complexity**: Medium-High  
**Estimated Effort**: 2-3 weeks

**Description**:
Allow users to edit messages within 5 minutes of sending. Show edit timestamp and edit count.

**Technical Approach**:

1. Add `isEdited`, `editedAt`, `editCount` to CircleMessage
2. Store edit history in separate table (for audits)
3. Socket event broadcasts edit
4. Validation: Can only edit own messages, within 5 minutes

**Database Schema**:

```prisma
model CircleMessage {
  id              Int       @id @default(autoincrement())
  content         String
  isEdited        Boolean   @default(false)
  editedAt        DateTime?
  editCount       Int       @default(0)

  circleId        String
  senderId        String
  createdAt       DateTime  @default(now())

  message_edits   MessageEdit[]
}

model MessageEdit {
  id              String    @id @default(uuid())
  messageId       Int
  previousContent String    // For history/audit
  editedAt        DateTime  @default(now())
  message         CircleMessage @relation(fields: [messageId])
}
```

**Validation Logic**:

```typescript
const editWindow = 5 * 60 * 1000; // 5 minutes
const now = Date.now();
const canEdit =
  message.senderId === userId && now - message.createdAt < editWindow;

if (!canEdit) throw EditWindowExpiredError();
```

**API Endpoint**:

```bash
PATCH /api/circles/:circleId/messages/:messageId
{ content: "Updated message" }
```

**UI Behavior**:

```bash
Original:    "Study at 3pm"
After edit:  "Study at 2pm" (edited)
Hover:       Tooltip shows "Edited at 10:05"
```

**Benefits**:

- Typo management
- Quick clarifications
- Still maintains audit trail

---

### P1.4: Offline Message Queue

**Status**: Designed, not implemented  
**User Impact**: HIGH - 40% of mobile users need  
**Business Impact**: Improves reliability on poor networks  
**Complexity**: Medium  
**Estimated Effort**: 2-3 weeks

**Description**:
Queue messages sent offline, sync when connection returns. Show sync status to user.

**Technical Approach**:

1. Use IndexedDB for client-side storage
2. Service worker for background sync
3. Retry logic with exponential backoff
4. Deduplicate on sync (don't send identical messages twice)

**Frontend Implementation**:

```typescript
// In offline handler
async function sendMessageOffline(content: string) {
  const pendingId = crypto.randomUUID();

  // Store in IndexedDB
  const db = new Database("circle-offline");
  await db.messages.add({
    id: pendingId,
    content,
    circleId,
    createdAt: new Date(),
    status: "offline",
  });

  // UI shows "Pending"
  store.addMessage({
    id: pendingId,
    status: "pending",
  });
}

// When connection restored
async function syncOfflineMessages() {
  const pending = await db.messages.where("status", "=", "offline").toArray();

  for (const msg of pending) {
    try {
      const real = await circlesAPI.sendMessage(msg.circleId, {
        content: msg.content,
      });
      await db.messages.update(msg.id, { status: "synced", realId: real.id });
      store.replaceOptimisticMessage(msg.id, real);
    } catch (err) {
      // Retry strategy
    }
  }
}
```

**Service Worker**:

```typescript
// Periodic background sync registration
navigator.serviceWorker.ready.then((reg) => {
  reg.periodicSync.register("study-circle-sync", {
    minInterval: 24 * 60 * 60 * 1000, // Daily
  });
});
```

**Benefits**:

- Seamless offline experience
- No lost messages
- Automatic retry on reconnect

---

## Priority 2 (P2) - Important Features

### P2.1: Message Search & Full-Text Index

**Status**: Designed, not implemented  
**User Impact**: MEDIUM - 30% of users want  
**Complexity**: Medium-High  
**Estimated Effort**: 2-3 weeks

**Description**:
Search within circle messages by keyword. Return paginated results with context.

**Database Setup** (PostgreSQL `pg_trgm`):

```sql
CREATE EXTENSION pg_trgm;

CREATE INDEX circlemessage_content_trgm_idx
ON CircleMessage USING gin(content gin_trgm_ops);
```

**API Endpoint**:

```bash
GET /api/circles/:circleId/messages/search?q=algorithms&limit=20&offset=0
```

**Query Implementation**:

```typescript
static async searchMessages(
  circleId: string,
  query: string,
  skip: number,
  take: number
): Promise<CircleMessage[]> {
  return prisma.circleMessage.findMany({
    where: {
      circleId,
      content: {
        search: query  // Full-text search using pg_trgm
      }
    },
    skip,
    take,
    orderBy: { createdAt: 'desc' }
  });
}
```

**Frontend**:

```typescript
<SearchInput
  onSearch={(query) => searchMessages(query)}
  results={<SearchResults messages={results} />}
/>
```

**Result Format**:

```bash
Query: "algorithm"
Results:
1. "We discussed sorting algorithms" ~ 2 days ago
2. "Algorithm complexity analysis" ~ 1 week ago
```

**Benefits**:

- Users can find past discussions
- Reduced cognitive load
- Discovery of relevant context

---

### P2.2: In-App Notifications

**Status**: Partially exists  
**Current**: Silent (no toast/badge for in-chat messages)  
**Desired**: Show toast, highlight messages  
**Complexity**: Low-Medium  
**Estimated Effort**: 1 week

**Description**:
Show toast notifications for mentions, keywords, direct messages (future).

**Implementation**:

```typescript
// Listen for new messages
socket.on("circle:new_message", (message) => {
  if (isMessageMentioning(message, currentUser.id)) {
    showToast({
      type: "mention",
      title: `@${message.sender.username} mentioned you`,
      body: message.content,
      action: () => navigateToCircle(message.circleId),
    });
  }
});
```

**Benefits**:

- Users don't miss mentions
- Improves real-time interaction
- Base for future direct messaging

---

### P2.3: Moderation Tools & Audit Log

**Status**: Partial (can mute/remove, no audit)  
**Current**: Manual, no logging  
**Desired**: Full audit trail, dashboard  
**Complexity**: Medium  
**Estimated Effort**: 2-3 weeks

**Description**:
Log all moderation actions (remove, mute, delete) with timestamps, reason, moderator.

**Database Schema**:

```prisma
model ModerationLog {
  id              String    @id @default(uuid())
  circleId        String
  action          String    // "remove", "mute", "delete", "role_change"
  targetUserId    String
  moderatorId     String
  reason          String?
  details         Json?     // duration for mute, old/new role
  createdAt       DateTime  @default(now())

  circle          Circle    @relation(fields: [circleId])
  target          User      @relation("moderated_user", fields: [targetUserId])
  moderator       User      @relation("moderator_user", fields: [moderatorId])

  @@index([circleId, createdAt])
}
```

**Moderation Dashboard**:

```bash
CircleSettings > Moderation
├─ Audit Log (search by date/moderator)
├─ Muted Members (list, unmute button)
└─ Recent Actions (last 30 days)
```

**Benefits**:

- Accountability for moderators
- Compliance with regulations
- Transparency for members

---

### P2.4: Advanced Role Management

**Status**: Designed, not implemented  
**Current**: OWNER, MODERATOR, MEMBER only  
**Desired**: Custom role definitions  
**Complexity**: Medium-High  
**Estimated Effort**: 2-3 weeks

**Description**:
Allow circle owners to define custom roles with specific permissions.

**Database Schema**:

```prisma
model CircleRole {
  id              String    @id @default(uuid())
  circleId        String
  name            String    // "TA", "Grader", etc.
  permissions     Permission[]

  circle          Circle    @relation(fields: [circleId])
}

model Permission {
  id              String    @id @default(uuid())
  roleId          String
  resource        String    // "circleMembers", "messages"
  action          String    // "delete", "mute", "add"

  role            CircleRole @relation(fields: [roleId])
}
```

**UI**:

```bash
CircleSettings > Roles
├─ Owner (all permissions) [default]
├─ Moderator (manage members, delete messages) [default]
├─ Member (send messages, read) [default]
├─ Custom:
│   ├─ TA (add members, delete messages, NO mute)
│   └─ Grader (read-only, can comment in review channel)
```

**Benefits**:

- Formal class structures
- Fine-grained permission control
- Flex for different use cases

---

## Priority 3 (P3) - Nice-To-Haves

### P3.1: Threaded Replies

**Status**: Analyzed, design incomplete  
**User Impact**: MEDIUM - 20% of users want  
**Complexity**: High  
**Estimated Effort**: 3-4 weeks

**Description**:
Reply to specific messages with threaded conversations. Prevents flat noise.

**Database Schema** (Self-Join):

```prisma
model CircleMessage {
  id              Int
  content         String
  circleId        String
  senderId        String
  replyToId       Int?        // Parent message
  createdAt       DateTime

  // Relations
  replies         CircleMessage[]
  replyTo         CircleMessage?  @relation("replies", fields: [replyToId])
}
```

**Thread View**:

```bash
Original Message
├─ User1: "This part is confusing"
│   ├─ User2: "Agreed need clarification"
│   └─ User3: "Check this resource"
└─ User1: "+2 more replies"
```

**Benefits**:

- Organize long discussions
- Reduce main chat noise
- Easier follow-ups

---

### P3.2: Message Archive & Auto-Cleanup

**Status**: Designed, not implemented  
**User Impact**: LOW - compliance/ops  
**Complexity**: Medium  
**Estimated Effort**: 1-2 weeks

**Description**:
Archive old messages to separate storage. Optionally delete after retention period.

**Implementation**:

- Batch job: Move messages > 90 days to archive table
- Archive query: Still visible in search, not in main feed
- Configuration: Per-circle retention policy

**Benefits**:

- Database performance (lean main table)
- Compliance (data retention rules)
- Storage cost reduction

---

### P3.3: Analytics Dashboard

**Status**: Not started  
**Scope**: Study circle activity metrics  
**Complexity**: Medium  
**Estimated Effort**: 2-3 weeks

**Metrics**:

- Message volume over time
- Active members per day
- Join/leave rates
- Engagement trends

**UI**:

```bash
CircleAnalytics
├─ Message count (line chart)
├─ Active members (card)
├─ Growth (week-over-week %)
└─ Peak hours (heatmap)
```

**Benefits**:

- Circle health visibility
- Detect declining engagement
- Inform moderation strategy

---

### P3.4: Voice/Video Integration

**Status**: Out of scope for MVP  
**Scope**: Call directly from circle  
**Complexity**: Very High  
**Estimated Effort**: 4-6 weeks  
**Infrastructure**: Video provider (Twilio, Jitsi)

**Description**:
Voice call and optional video from study circle interface.

**Approach**:

```bash
Circle View
├─ Start Voice Call button
│   ├─ Ring all circle members
│   ├─ Join/decline UI
│   └─ In-call participant list
```

**Benefits**:

- Seamless sync between chat + voice
- Reduces external tool switching
- Real-time collaboration

---

## Priority 4 (P4) - Future Enhancements

### P4.1: Collaborative Editing

**Status**: Research phase  
**Scope**: Shared document/whiteboard in circle  
**Complexity**: Very High  
**Estimated Effort**: 6-8 weeks

**Description**:
Edit documents together in real-time within circle context.

**Technology**:

- Operational Transformation (OT) or CRDTs
- Vector clock sync
- Conflict resolution

---

### P4.2: Calendar Integration

**Status**: Designed, not implemented  
**Scope**: Schedule study sessions in circle  
**Complexity**: Medium  
**Estimated Effort**: 2-3 weeks

**Description**:
Create and share study session calendars within circle.

**Features**:

- Create recurring study sessions
- RSVP tracking
- Reminders on event day

---

### P4.3: Gamification

**Status**: Concept only  
**Scope**: Points, badges, leaderboards  
**Complexity**: Medium  
**Estimated Effort**: 2-3 weeks

**Description**:
Encourage participation with points/achievements.

**Metrics**:

- Messages sent: +1 point each
- Questions answered: +5 points
- Helpful reactions: +2 points
- Badges: "10K messages", "Helpful answerer"

---

### P4.4: Integration with LMS

**Status**: Future consideration  
**Scope**: Sync with Canvas, Blackboard  
**Complexity**: High  
**Estimated Effort**: 3-4 weeks

**Description**:
Auto-create circles for course sections, import rosters.

**Benefits**:

- Seamless for formal education
- Auto-enrollment
- Reduces manual setup

---

## Success Metrics

### Feature Adoption

- P1.1 Push: 60%+ opt-in rate
- P1.2 Reactions: Used in 40% of messages (first month)
- P1.3 Editing: 15% of messages edited within window

### Performance

- Maintain < 100ms message latency through all features
- Unread count query < 50ms even with new features

### User Satisfaction

- NPS score increase of 10 points per P1 feature
- Churn reduction of 5% per engagement feature

---

## Conclusion

The Study Circle roadmap balances immediate engagement needs (P1 notifications, reactions) with stability improvements (search, archive) over 18 months. Prioritize P1 features for competitiveness, then P2 for retention, then P3+ for scale.
