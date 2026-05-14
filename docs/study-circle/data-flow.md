# Study Circle Data Flows

**Document Type**: Technical Deep Dive  
**Audience**: Senior engineers understanding complex flows  
**Last Updated**: March 30, 2026

---

## Complete Message Lifecycle

This is the complete journey of a message from send to unread count.

### Step-by-Step Flow

```bash
SEND PHASE
================================================================================

1. User Types Message
   Frontend: User enters "Hello" in MessageInput, clicks Send

2. Optimistic Update
   Frontend: Add message with id=-1 to store immediately
   Store: pendingMessages = [{ id: -1, content: "Hello", ... }]
   UI: Message appears in feed immediately (gray/pending styling)

3. REST Request
   Frontend: POST /api/circles/circle-123/messages
   Body: { content: "Hello" }

4. Controller Receives Request
   Backend: CircleMessageController.sendMessage()
   - Validate user authentication
   - Extract user context

VALIDATION PHASE
================================================================================

5. Business Logic Validation
   Backend: CircleMessageService.sendMessage()
   - Call CircleValidationService.verifyMembership(userId, circleId)
     ✓ User IS member
   - Call CircleValidationService.ensureMemberNotMuted(...)
     ✓ User NOT muted

6. Mute Check Detail
   Backend: Check CircleMember.mutedUntil
   - If mutedUntil IS NULL → Not muted → Proceed
   - If mutedUntil > now → Muted → Throw MemberMutedError (403)
   - If mutedUntil ≤ now → Mute expired → Proceed

PERSISTENCE PHASE
================================================================================

7. Database Create
   Backend: CircleRepository.createMessage()
   SQL:
   INSERT INTO CircleMessage (content, circleId, senderId, createdAt)
   VALUES ('Hello', 'circle-123', 'user-2', '2026-03-30T10:00:00Z')

   Result:
   {
     id: 42,
     content: 'Hello',
     circleId: 'circle-123',
     senderId: 'user-2',
     createdAt: '2026-03-30T10:00:00Z'
   }

8. HTTP Response
   Backend: Send 201 Created with message
   Response:
   {
     id: 42,
     content: 'Hello',
     circleId: 'circle-123',
     sender: { id: 'user-2', username: 'abc', avatarUrl: '...' },
     createdAt: '2026-03-30T10:00:00Z'
   }

BROADCAST PHASE (Real-Time)
================================================================================

9. Socket.io Emission
   Backend:
   io.to("circle:circle-123").emit("circle:new_message", message)

   Recipients: ALL users in room "circle:circle-123"

10. Clients Receive Event
    Frontend (Each connected user):
    socket.on("circle:new_message", (message) => {
      store.deduplicateAndAddMessage(message);
    });

    Deduplication Check:
    - Sender matches? ✓
    - Content matches? ✓
    - Timestamp ~ same? ✓
    → Already in pendingMessages, SKIP (prevent duplicate)

    Sender's Client (user-2):
    - Optimistic -1 already in UI
    - Real message 42 arrives
    - Store.replaceOptimisticMessage(-1, realMessage)
    - Update Cache: queryClient.setQueryData(
        ["circles", "circle-123", "messages"],
        old => [...old, realMessage]
      )

    Other Clients (not sender):
    - Real message 42 arrives via socket
    - Not in messages list yet
    - Store.addMessage(realMessage)
    - Now message appears in their feed

11. Frontend State Updates
    All clients:
    - Messages array updated
    - UI re-renders
    - Message appears in feed with id=42, not pending
    - Timestamp verified with server time

UNREAD COUNTING PHASE
================================================================================

12. Member Has Message in Feed (Other Users)
    Frontend: Other users viewing circle see the new message
    Unread count hasn't changed yet (they're viewing it)

13. Member NOT Viewing Circle
    Frontend: Users not in this circle room
    - Still have presence in circle (app open, other page)
    - OR completely offline

14. Batch Unread Count Query (Periodic)
    Backend: Triggered by:
    - User enters hub/discovery page
    - User refreshes page
    - Periodic background refresh

    Query executed:
    GET /api/circles/unread-counts

    Backend: CircleRepository.countUnreadMessagesBatch(userId)
    SQL Query:
    SELECT
      m.circleId,
      COUNT(*) as unread_count
    FROM CircleMessage m
    LEFT JOIN CircleMember cm
      ON cm.circleId = m.circleId
      AND cm.userId = 'user-1'
    WHERE m.circleId IN (
      SELECT DISTINCT circleId
      FROM CircleMember
      WHERE userId = 'user-1'  -- user-1 is in circles 1, 3, 5
    )
    AND m.createdAt > COALESCE(cm.lastReadAt, '1970-01-01')
    AND m.senderId != 'user-1'               -- Exclude own messages
    GROUP BY m.circleId

    Result:
    [
      { circleId: 'circle-123', unread_count: 1 },  -- Our message!
      { circleId: 'circle-456', unread_count: 0 },
      { circleId: 'circle-789', unread_count: 3 }
    ]

15. Unread Count Calculation Rules
    For user-1 not in circle-123 room:

    Unread Math:
    select count where createdAt > lastReadAt

    User Scenario A (Never entered):
    - lastReadAt = NULL
    - COALESCE(NULL, '1970-01-01') = '1970-01-01'
    - Counts ALL messages after epoch
    - Result: Entire message history counted as unread

    User Scenario B (Joined but hasn't entered room):
    - lastReadAt = '2026-03-30T09:00:00Z' (set on join)
    - Message sent at '2026-03-30T10:00:00Z'
    - 10:00:00 > 09:00:00 ✓
    - Result: 1 unread (our new message!)

    User Scenario C (Viewing circle, message sent):
    - lastReadAt = '2026-03-30T10:00:00Z' (was viewing)
    - Message sent at '2026-03-30T10:00:00Z' (same time)
    - 10:00:00 > 10:00:00? ✗
    - Result: 0 unread (already in feed)

    User Scenario D (Viewing circle, leaves during message):
    - Cached unread count while viewing: 0
    - Message sent: '2026-03-30T10:30:00Z'
    - Navigates away
    - Next unread check (hub page):
      - lastReadAt still = '2026-03-30T10:00:00Z'
      - 10:30:00 > 10:00:00 ✓
      - Result: 1 unread (marked as unread)

16. Frontend Update Display
    Response: { circle-123: 1, circle-456: 0, ... }

    Store: updateUnreadCounts({ circle-123: 1, ... })

    UI Update:
    CircleCard shows:
    - "circle-123" badge with "1" unread messages
    - Highlights in bold or with color

MARK AS READ PHASE
================================================================================

17. User Enters Circle Room
    Frontend: User navigates to circle-123 room view
    useCircleRoom hook:
    socket.emit("circle:join_room", { circleId })

18. Update Last Read
    Frontend: useCircleSync hook
    circlesAPI.updateLastReadAt(circleId)

    Backend: POST /api/circles/circle-123/members/me/read

    CircleRepository.updateLastReadAt(userId, circleId, new Date())
    SQL:
    UPDATE CircleMember
    SET lastReadAt = NOW()
    WHERE userId = 'user-1'
    AND circleId = 'circle-123'

    Result:
    lastReadAt = '2026-03-30T10:35:00Z' (now, user viewing)

19. Unread Count Resets
    Frontend: Component triggers unread recount
    Or: User navigates back to hub

    Batch Query (from Step 14) now returns:
    - circle-123: unread_count = 0
    (because all messages have createdAt < 10:35:00)

    UI: Badge disappears from "circle-123"

================================================================================
```

### Timeline Diagram

```bash
10:00:00 ← Message created in DB
          ← Socket event broadcast

          User A (Sender):
          -1 → 42 (optimistic replaced with real)

          User B (Viewing):
          Message appears in feed immediately
          Unread stays 0 (already viewing)

          User C (Not viewing):
          no update to their UI
          nextUnread count = 1

10:30:00 ← User C returns to hub
          ← Batch unread query runs
          ← circle-123 shows badge "1"

10:35:00 ← User C enters circle-123 room
          ← updateLastReadAt() called
          ← lastReadAt set to 10:35:00

          ← User C navigates back to hub
          ← Batch unread query runs again
          ← Message sent before 10:35:00
          ← 10:00:00 NOT > 10:35:00
          ← circle-123 badge disappears
```

---

## Join Circle Flow

Complete flow when user joins a public circle.

### Step-by-Step

```bash
1. User Clicks "Join" Button
   Frontend: useJoinCircleMutation.mutate(circleId)

2. POST Request
   Frontend: POST /api/circles/circle-123/join

3. Handler Receives Request
   Backend: CircleCoreController.joinCircle()
   - Extract userId from auth
   - Call CircleService.joinCircle(circleId, userId)

4. Business Logic
   Backend: CircleCoreService.joinCircle()
   - Verify circle exists
   - Check NOT private (public circles only)
   - If private, throw AuthorizationError
   - Delegate to CircleMemberService.addMemberToCircle()

5. Unified Member Addition
   Backend: CircleMemberService.addMemberToCircle()
   Parameters:
   - userId: 'user-2'
   - circleId: 'circle-123'
   - role: 'MEMBER' (default for public join)
   - requester: undefined (no admin context)

   Validation:
   - verifyCircleExists() → ✓
   - checkMembership() → ✗ (not member yet)
   - assertCirclePermission() → skipped (public join)

6. DATABASE INSERT KEY STEP
   Backend: CircleRepository.addMember(data, new Date())

   *** CRITICAL: lastReadAt = new Date() ***

   SQL:
   INSERT INTO CircleMember(userId, circleId, role, joinedAt, lastReadAt)
   VALUES('user-2', 'circle-123', 'MEMBER', NOW(), NOW())

   Why NOW() for lastReadAt?
   - Without this: lastReadAt = NULL
   - Query: createdAt > COALESCE(NULL, '1970-01-01')
   - Result: ALL messages counted as unread (from epoch!)
   - User sees all 1000+ pre-join messages as unread

   With NOW():
   - lastReadAt = joined time
   - Query: createdAt > joinedTime
   - Result: Only NEW messages post-join counted as unread
   - UX Fixed!

7. Response Sent
   Backend: Return transformed member data
   {
     userId: 'user-2',
     circleId: 'circle-123',
     role: 'MEMBER',
     joinedAt: '2026-03-30T11:00:00Z',
     lastReadAt: '2026-03-30T11:00:00Z'  ← Set to NOW
   }

8. Frontend Update
   Frontend: Mutation success → invalidate circles cache
   queryClient.invalidateQueries({ queryKey: ["circles"] })

   UI:
   - Remove from discovery list
   - Add to "My Circles"
   - Show in circles list
   - Update unread counts (now 0)

9. Socket Optional
   Frontend: Can emit join_room to see members
   socket.emit("circle:join_room", { circleId }, callback)
```

---

## Presence Tracking Flow

Dual-layer presence (viewing vs. app open).

### Viewing Circle (Present)

```bash
User enters CircleRoomView for circle-123
    ↓
Socket emits: circle:join_room { circleId: "circle-123" }
    ↓
Backend: joinCircleHandler
    ├─ socket.join("circle:circle-123")
    ├─ Get presentMemberIds = [user1, user2, user3]
    ├─ Get onlineMemberIds = [user1, user2, user3, user4]
    └─ Emit response { presentMemberIds, onlineMemberIds }
    ↓
Frontend: Receive callback
    ├─ Store.setPresentMembers(presentMemberIds)
    └─ UI: "User1, User2, + 1 more are here"
    ↓
Broadcast to other viewers:
    io.to("circle:circle-123")
       .emit("circle:member_joined", { user: { id, username } })
    ↓
Other viewers in room:
    Store.addPresentMember(userId)
    UI: "User4 is here now" or updated count
```

### User Leaves Room

```bash
User navigates away (but stays in app)
    ↓
Socket emits: circle:leave_room
    ↓
Backend: leaveCircleHandler
    ├─ socket.leave("circle:circle-123")
    ├─ Remove from joined circles Set
    └─ Broadcast to room: circle:member_left
    ↓
Other viewers:
    Store.removePresentMember(userId)
    io.to("circle:circle-123")
       .emit("circle:member_left", { user: { id, username } })
```

### Presence Count Broadcast (Discovery)

```bash
User browsing CircleHub (discovery page)
    ↓
Watch circles: circle:watch_discovery { circleIds: [...] }
    ↓
Backend: discoveryWatchHandler
    socket.join("discovery:circle-123")
    socket.join("discovery:circle-456")
    ↓
When members join/leave any watched circle:
    ← Trigger presence update
    io.to("discovery").emit(
      "circle:presence_counts_update",
      { counts: { "circle-123": 3, "circle-456": 1, ... } }
    )
    ↓
Frontend: All discovery watchers receive update
    Store.updatePresenceCounts(counts)
    UI: Circle cards show "3 members online"
```

---

## Permission Check Flow

RBAC enforcement with role hierarchy.

### Add Member (Admin)

```bash
POST /api/circles/circle-123/members
{ userId: "user-5" }

Requester: user-1 (MODERATOR)
================================================================================

1. Controller receives request
   - Extract requester from auth
   - Extract circleId, targetUserId from request

2. Enrich requester with circle role
   circleMiddleware.enrichCircleRole()

   Query: SELECT role FROM CircleMember
          WHERE userId=user-1 AND circleId=circle-123

   Result: requester.circleRole = "MODERATOR"

3. Call service
   CircleMemberService.addMember(data, requester)

4. Service validates
   verifyCircleExists() → ✓
   checkMembership(user-5, circle-123) → Already member? ✗

5. Permission check
   assertCirclePermission(
     requester: { id: "user-1", circleRole: "MODERATOR" },
     resource: "circleMembers",
     action: "add",
     targetData: { role: "MEMBER" }
   )

   RBAC Rules:
   - OWNER: Can add any role (OWNER, MOD, MEMBER)
   - MODERATOR: Can add MEMBER or MODERATOR (NOT OWNER)
   - MEMBER: Cannot add anyone

   Logic:
   - requester.circleRole = "MODERATOR"
   - targetRole (implicit) = "MEMBER"
   - Is MODERATOR >= MEMBER? ✓
   - Result: PASS

6. Add member
   CircleRepository.addMember(data, new Date())
   - Set lastReadAt = NOW (for unread tracking)

7. Success
   Return: { userId, circleId, role, joinedAt, lastReadAt }
```

### Mute Member (Hierarchy)

```bash
PATCH /api/circles/circle-123/members/user-3/mute
{ duration: 60 }

Requester: user-1 (OWNER)
Target: user-3 (MODERATOR)
================================================================================

1. Permission check
   assertCirclePermission(
     requester: { circleRole: "OWNER" },
     resource: "circleMembers",
     action: "mute"
   )

2. Hierarchy check
   OWNER can mute: MODERATOR, MEMBER
   Can OWNER mute MODERATOR? ✓

3. Mute validation
   Verify user-3 is member of circle-123

4. Update database
   UPDATE CircleMember
   SET mutedUntil = NOW() + 60 minutes
   WHERE userId = user-3 AND circleId = circle-123

5. Effect
   Next 60 minutes: user-3 cannot send messages
   message send check will fail:
   - CircleValidationService.ensureMemberNotMuted()
   - membership.mutedUntil > now? → Throw MemberMutedError

6. Auto-unmute
   After 60 minutes: mutedUntil < now, mute expires
   User can send messages again
```

---

## Unread Count Calculation Edge Cases

### Case 1: Never Accessed Circle

```bash
User joins circle, never enters room

User Scenario:
- joinedAt: '2026-03-30T09:00:00Z'
- lastReadAt: NULL ❌ (BUG: Would count all history)
- With fix: lastReadAt: '2026-03-30T09:00:00Z' ✓

Problem without fix:
- Unread query: createdAt > COALESCE(NULL, '1970-01-01')
- ALL messages since 1970 count as unread!
- User sees "9999 unread" for old circle

Solution:
- Set lastReadAt = NOW on join
- Only NEW messages post-join count as unread
```

### Case 2: Late Joiner

```bash
Circle created 1 month ago with 500 messages

User joins now:
- 500 pre-join messages exist
- lastReadAt: NOW (on join)
- Query: createdAt > NOW
- Result: 0 unread (correct!)

UX: New member enters circle fresh, no massive unread count
```

### Case 3: Message Sent While Offline

```bash
User offline, message arrives

Timeline:
10:00:00 - User last viewing: lastReadAt = 10:00:00
10:30:00 - User goes offline
11:00:00 - Message sent (user offline still)
11:30:00 - User comes back online

Unread query (11:30:00):
- createdAt = 11:00:00
- lastReadAt = 10:00:00
- 11:00:00 > 10:00:00 ✓
- Result: 1 unread message (correct!)
```

### Case 4: Your Own Messages

```bash
User sends 3 messages

Query filters:
WHERE senderId != userId

Your messages:
- Not counted in unread for you
- Logical: Can't be unread by yourself
```

### Case 5: Batch Count Consistency

```bash
User in 10 circles

N+1 Problem (old way):
Loop 10 times:
  SELECT COUNT(*) FROM CircleMessage
  WHERE circleId = ? AND createdAt > ? AND senderId != ?
Result: 10 database queries

Optimized (now):
SELECT circleId, COUNT(*) FROM CircleMessage
WHERE circleId IN (user's 10 circles)
AND createdAt > COALESCE(lastReadAt, epoch)
GROUP BY circleId
Result: 1 database query
Performance: 100x improvement
```

---

## Error Recovery Flows

### Message Send Fails

```bash
User sends message
Online, valid, passes all checks
BUT database write fails

Timeline:
1. Frontend: POST /api/circles/circle-123/messages
   Body: { content: "Hello" }

2. Add optimistic: id=-1 to UI

3. Server error: 500 Internal Server Error
   CircleRepository.createMessage() throws

4. Frontend catch error:
   onError() callback:
   - Remove optimistic message (-1)
   - Show toast: "Failed to send"
   - User can retry

5. UI recovery:
   Message disappears from feed
   User sees message wasn't sent
   Can retype and send again
```

### Join Circle Fails

```bash
User clicks Join
Circle was deleted between load time and join

Timeline:
1. POST /api/circles/circle-123/join

2. Backend: CircleNotFoundError
   Response: 404 Not Found

3. Frontend:
   onError() callback:
   - Don't remove from discovery (handled by parent)
   - Show toast: "Circle no longer exists"
   - Optionally refetch discovery list

4. Discovery list:
   Circle might disappear on next refresh
```

### Socket Connection Lost

```bash
User viewing circle, network drops

Timeline:
1. User in room: socket.id = "abc123"
   Socket rooms: ["circle:circle-123"]

2. Network disconnects
   Socket.io: reconnection: true
   Attempts reconnection with exponential backoff

3. While reconnecting:
   - UI shows "connecting..." indicator
   - Messages not sent (will fail with offline error)
   - Message input disabled

4. Reconnection successful:
   socket.io auto-rejoin rooms
   - Rejoins "circle:circle-123"
   - joinCircleHandler called
   - Presence restored
   - Message input re-enabled

5. If reconnection fails (5 attempts):
   - Show "Connection lost" error
   - Manual reconnect button
   - Fallback to polling for updates
```

---

## Performance Optimization Flows

### Unread Count Caching

```bash
User views hub 3 times in 5 minutes

Time | Action | Cache | Query
-----|--------|-------|-------
0:00 | Load hub | MISS | Run batch query
0:05 | Switch to room | STALE | -
0:05 | Return to hub | Fresh (<5min) | SKIP (use cache)
0:10 | Return to hub | STALE (>5min) | Run batch query

Result: 2 queries instead of 3
```

### Socket Room Broadcasts

```bash
1000 users in discovery watching circle-123

Event: User joins circle
Consequence: Presence count changed

Old naive way:
- Broadcast to ALL users globally
- Wasted bandwidth for 999 watchtowers

Actual way:
- Join watchers to: "discovery:circle-123" room
- Broadcast: io.to("discovery:circle-123")
- Only 999 users in that room get update

Result: Targeted broadcast, scalable
```

---

## Sequence Diagrams

### Send Message Full Sequence

```bash
User        Frontend        Backend        Database        Other Users
 │              │                │              │                 │
 ├─ Type ──────>│                │              │                 │
 │              │                │              │                 │
 ├─ Click ──────>│                │              │                 │
 │              ├─ Optimistic ──>│              │                 │
 │              │ (id=-1)         │              │                 │
 │              │                 │              │                 │
 │              ├─ POST ─────────>│              │                 │
 │              │                 ├─ Validate ──┤                 │
 │              │                 │              │                 │
 │              │                 ├─ INSERT ────>│                 │
 │              │                 │ (id=42)      │                 │
 │              │                 │<─ id:42 ─────┤                 │
 │              │                 │              │                 │
 │              │<─ 201 ───────────┤              │                 │
 │              │                 │              │                 │
 │              ├─ Replace ──────>│              │                 │
 │              │ -1→42           │              │                 │
 │              │                 │              │                 │
 │              │                 ├─ Broadcast ──────────────────>│
 │              │                 │ "new_message"                  │
 │              │                 │                                │
 │              │                 │              ├─ Add to feed ───┤
 │              │                 │              │ (no duplicate) │
 │              │                 │              │                 │
 │    Show ─────┤                 │              │        Show ───>│
 │   (id=42)    │                 │              │                 │
 │              │                 │              │                 │
```

---

## Conclusion

The data flows in Study Circle are designed for:

- **Optimistic Updates**: Instant UI feedback without waiting for server
- **Real-Time Sync**: WebSocket broadcasts for collaborative feel
- **Smart Unread Counting**: Batch queries + join-time timestamp prevent old message flooding
- **Presence Awareness**: Dual-layer tracking for both viewing and app-wide presence
- **Error Resilience**: Graceful degradation on network failures
- **Performance**: Single query unread counts, targeted Socket.io broadcasts

Understanding these flows is key to debugging issues and extending the feature.
