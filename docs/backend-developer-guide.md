# KlasMwen Backend Architecture & Developer Guide

This document explains the **KlasMwen backend** with clarity and modular guidance, making it easy for **future-you** or a **completely new developer** to understand the architecture, design patterns, and operational flow.

---

## 1. Backend Structure & Flow

The backend is written in **TypeScript** using **Express 5** and **Prisma ORM**, following a **modular, feature-based architecture** with strict separation of concerns.

### Key Directories

```bash
backend/
├── prisma/           # Schema, migrations, seed scripts
└── src/
    ├── controllers/ # Route handlers (thin layer)
    ├── core/        # Config, security, logging, error handling
    ├── features/    # Feature-specific services, repositories
    ├── middlewares/ # Auth, rate-limiting, logging
    ├── routes/      # API routes
    ├── seeds/       # Database seed scripts
    ├── swagger/     # OpenAPI documentation
    ├── utils/       # Helpers
    ├── zodSchemas/  # Input validation schemas
    ├── app.ts       # Express initialization
    └── index.ts     # Entry point
```

### Architectural Flow

```text
Request → Middleware → Controller → Service → Repository → Prisma → Response
```

- **Controller:** Thin orchestration layer.
- **Service:** Core business logic.
- **Repository:** Prisma data access.
- **Transformers/Enrichers:** Shape and enrich raw data.
- **Zod Schemas:** Validate inputs.

---

## 2. Request Lifecycle (CSR Flow)

Every request passes through a controlled **Controller-Service-Repository (CSR) pattern**.

```text
Client → Middleware → Controller → Service → Repository → Prisma → Response
```

### Controller Responsibilities

- Validates inputs using **Zod schemas**.
- Calls **service methods**.
- Returns **standardized JSON responses**.
- Uses `withLogging<AuthenticatedRequest>` wrapper for automatic logging, timing, and error forwarding.

### Service & Repository Layers

- **Service:** Enforces business rules, orchestrates repository and transformers.
- **Repository:** Handles raw database queries via Prisma.
- **Transformer/Enricher:** Shapes data and adds user-specific context.

### Error Handling in Controllers

Controllers use the `withLogging<AuthenticatedRequest>` wrapper instead of manual `try/catch`. The wrapper handles timing, logging, and error forwarding automatically:

```ts
import { withLogging } from "@/middlewares/withLogging.js";

export const createPost = [
  withLogging<AuthenticatedRequest>(async (req, res, next) => {
    log.info("Creating post");
    const data = CreatePostRequestSchema.parse(req.body);
    const post = await postService.command.createPost(data, req.user!);
    res.status(201).json({ data: post });
  }),
];
```

Key points:

- `withLogging` wraps the handler — no `try/catch` in controllers
- On failure, errors propagate to the centralized `errorMiddleware`
- `next(error)` is called automatically by the wrapper
- Consistent error formatting across the application

---

## 3. Service Layer & Business Logic

Services are the **business logic core**. Each feature module has its own service orchestrating:

| Layer       | Responsibility                    |
| ----------- | --------------------------------- |
| Service     | Orchestration & business rules    |
| Repository  | Data access (Prisma queries only) |
| Transformer | Normalize and shape data          |
| Enricher    | Add user-specific computed data   |

### Example Workflow: PostService

```ts
const posts = await PostRepository.findManyPosts();
const transformed = PostTransformer.transformPosts(posts);
const states = await PostEnricher.getBookmarkAndLikeStates(
  transformed,
  currentUserId
);
const enriched = PostEnricher.enrichPostsWithStates(
  transformed,
  states,
  currentUserId
);
return processPaginatedResults(enriched);
```

**Benefits:**

- Thin controllers.
- SRP: each layer has one responsibility.
- Easier debugging and testing.

---

## 4. Authentication & Security

Uses **Passport.js** with a **stateless JWT-based system**, secured via **httpOnly cookies**.

### Strategies

- **Local Strategy:** Login; hashes passwords with bcryptjs.
- **JWT Strategy:** Authorizes requests using tokens from cookies.

### Cookies & Security

| Option   | Description                         |
| -------- | ----------------------------------- |
| httpOnly | Prevents JS access (XSS protection) |
| secure   | HTTPS only in production            |
| sameSite | Enables cross-domain cookie sharing |
| maxAge   | Token expiration (e.g., 3 days)     |

### Route Guard Example

```ts
router.post("/posts/:id/comments", requireAuth, createComment);
```

---

## 5. Validation Layer (Zod)

**Zod** ensures runtime validation and type safety:

- Located in `src/zodSchemas/`.
- Ensures clean data enters services.
- Discriminated unions enforce type-specific rules.

```ts
const NewPostRequestSchema = z.discriminatedUnion("type", [
  TextPostRequestSchema,
  ResourcePostRequestSchema,
]);
```

**Outcome:** Input matches expected type; invalid requests are rejected with **400 Bad Request**.

---

## 6. Error Handling & Core Modules

Centralized error handling ensures **consistency** and **separation of concerns**:

- `/core/config/` → setup of DB, Passport, logger, Cloudinary, CORS.
- `/core/error/` → custom errors, centralized `handleError` function, specialized handlers for Zod, JWT, Prisma, Multer, etc.

### Example: Validation Error Handler

```ts
class ValidationErrorHandler {
  static handleValidationError(error: ZodError) {
    return {
      status: 400,
      response: {
        message: "Validation failed",
        errors: error.issues.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      },
    };
  }
}
```

---

## 7. Configuration & Environment

Follows **12-Factor App principles**:

- `.env` files for local development, loaded via `dotenv`.
- `process.env` used throughout.
- Configuration isolated in `src/core/config/`.
- Pre-flight checks verify DB, Cloudinary, and logger.

### Environment Variable Validation

To ensure type safety and correctness, environment variables are validated using a **Zod schema** (`envSchema`) on startup:

```ts
import dotenv from "dotenv";
import { z } from "zod";
import envSchema from "../../zodSchemas/env.zod.js";

dotenv.config({ override: true });

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    z.prettifyError(parsed.error)
  );
  throw new Error("Invalid environment variables");
}

const env = parsed.data;
export default env;
```

- `env` is exported and used across the backend wherever environment variables are needed.
- This ensures **type-safe, validated access** to all critical configuration values.

### Pre-flight Checks

- Ensures that DB connections, Cloudinary, logger, and other critical services are reachable before starting the server.
- Provides early failure and clear error reporting for misconfigurations.

---

## 8. Request Logging & Context Tracing

Structured logs with unique **request IDs** for each incoming request:

```ts
req.logContext = { module: moduleName, requestId, ip: req.ip ?? "unknown" };
```

Enables **traceable, correlated logs** across requests.

---

## 9. Real-Time Communication & Notifications (Socket.IO)

The backend supports **real-time features** using **Socket.IO**, currently implemented for **user notifications** and designed to scale naturally to future features such as **group chat** and live interactions.

This system follows the same architectural principles as the HTTP layer:

- centralized business logic
- strict separation of concerns
- authenticated, user-scoped communication

---

### 1. Design Goals

The real-time layer is built to:

- deliver **instant, user-specific updates** (e.g. notifications)
- reuse existing **authentication and authorization models** (JWT + cookies)
- avoid leaking socket logic into controllers
- remain extensible for future real-time features (e.g. group chat, presence)

Socket.IO is treated as a **transport mechanism**, not a source of business logic.

---

### 2. Socket.IO Initialization

Socket.IO is initialized alongside the HTTP server and shares the same runtime, configuration, and CORS policy.

- Uses the same HTTP server as Express
- CORS configuration is shared with REST endpoints
- The `io` instance is attached to the Express app for downstream access

This allows HTTP-driven actions (such as creating a comment) to trigger real-time events without tightly coupling controllers to Socket.IO.

---

### 3. Authentication & Security

All socket connections are **authenticated during the handshake** using a dedicated Socket.IO middleware.

#### Authentication Flow

1. Client establishes a socket connection
2. JWT is extracted from **httpOnly cookies**
3. Token is verified using the same JWT secret as REST endpoints
4. The authenticated user is fetched from the database
5. The user object is attached to `socket.data.user`

Unauthenticated or invalid connections are rejected before the socket is established.

**Result:** Socket connections are as secure and trusted as HTTP requests.

---

### 4. User-Scoped Rooms

Each authenticated socket joins a **private, user-specific room** on connection:

```text
user:{userId}
```

This strategy enables:

- targeted, per-user event delivery
- multiple simultaneous connections per user (multi-tab, multi-device)
- clean separation between users without broadcasting sensitive data

Rooms are used as the primary delivery mechanism for notifications.

---

### 5. Notification Types (Current Scope)

The real-time system currently handles **notification delivery** for key user interactions, including:

- post interactions (e.g. comments, replies)
- reactions (likes, bookmarks)
- moderation or system-driven events (future expansion)

All notification creation logic remains **centralized in the notification service layer**.

---

### 6. HTTP → Socket Bridge Pattern

Real-time events are emitted as **side effects of successful business operations**, not directly from controllers.

#### Flow Example: Creating a Comment

```text
HTTP Request
  ↓
Controller
  ↓
Comment Service
  ↓
Notification Service
  ↓
Prisma (persist notification)
  ↓
Socket.IO emit → user:{targetUserId}
```

Key principles:

- Controllers remain transport-agnostic
- Services control _when_ notifications should be sent
- Socket.IO is accessed via `req.app.get("io")`
- No socket logic leaks into routing or controllers

---

### 7. Error Handling & Safety

- Socket authentication failures are handled during the handshake
- Notification emission failures do **not** break HTTP responses
- Self-notifications are explicitly prevented at the service level

This ensures real-time features enhance UX without compromising system stability.

---

### 8. Extensibility: Future Real-Time Features

This architecture is intentionally designed to support future features such as:

- group chat
- typing indicators
- presence (online/offline)
- live moderation updates

Future real-time modules will follow the same patterns:

- authenticated sockets
- room-based communication
- service-driven event emission
- strict separation between domain logic and transport

---

### Summary

The real-time layer in KlasMwen:

- integrates seamlessly with the existing backend architecture
- uses secure, authenticated Socket.IO connections
- delivers targeted, scalable notifications
- remains flexible for future real-time expansion

Socket.IO is treated as an **infrastructure layer**, while business decisions remain firmly within services.

---

## 10. Role-Based Access Control (RBAC)

The backend implements a **type-safe, flexible RBAC system** using a **registry** and **policy** approach.

### Registry & Policy

- **`registry`** defines resources (e.g., `post`, `comment`) and actions (`create`, `read`, `update`, `delete`, `report`).
- **`POLICY`** maps roles to resources and actions, with values that are **boolean** or **functions** for dynamic checks (like ownership).

### Permission Functions

- **`hasPermission(user, resource, action, data?)`** → returns `true/false` depending on the user's rights.
- **`assertPermission(user, resource, action, data?)`** → throws `AuthorizationError` if permission is denied.

### Permission Service Injection

Permission checks are performed through **injected service instances** rather than static imports:

```ts
export class PostCommandService {
  constructor(private permission: PermissionService) {}

  async deletePost(postId: string, user: AuthUser): Promise<void> {
    const post = await PostRepository.findPostById(postId);
    if (!post) throw new PostNotFoundError();

    this.permission.assertCan("post", "delete", user, post);
    await PostRepository.deletePost(postId);
  }
}
```

Two permission service classes exist:

- **`PermissionService`** — global RBAC (posts, comments, users, etc.)
- **`CirclePermissionService`** — circle-scoped RBAC (circles, circleMembers, circleMessages)

Both provide typed semantic methods for complex checks and a generic `assertCan<Res extends keyof Registry>` for simple boolean checks.

### Benefits

- Centralized, type-safe permissions.
- Supports ownership and conditional access.
- Consistent enforcement across controllers, services, and even frontend checks.
- Fully mockable in tests — no `vi.mock("...rbac.js")` needed.

---

## 11. Quick Start / How-To Guides

This section provides a structured approach for adding new features, routes, controllers, and RBAC permissions in the KlasMwen backend.

### 10.1 Add a New Feature

1. Create a folder under `src/features/featureName/`.
2. Add core subdirectories:

   - `serviceLayer/` → Business logic for the feature.
   - `helpers/` or `utils/` → Reusable utilities specific to the feature.

3. Add `controllers/`:

   - `src/controllers/moduleName.controller.ts` → Define route handlers.

4. Add `routes/`:

   - `src/routes/moduleName.route.ts` → Define endpoints and route logic.

5. Define request/response validation using **Zod schemas** in `src/zodSchemas/`.
6. Connect repository/service methods to controllers.
7. Register routes in the backend router (`src/routes/index.route.ts`).

### 10.2 Add a Controller Method

1. Create or update the controller for your feature.
2. Import the relevant service instance.
3. Use `withLogging<AuthenticatedRequest>` wrapper — no `try/catch` needed.
4. Validate incoming requests with the corresponding Zod schema.
5. Return standardized JSON responses.

### 10.3 Add a Route

1. Define a route in `routes/moduleName.route.ts`.
2. Wrap the route with middleware if authentication or RBAC is required (`ensureAuthenticated`, `assertPermission`, etc.).
3. Connect route handlers from the controller.

### 10.4 Add Permission Checks

1. Add the resource and actions to the shared `Registry` in `@klasmwen/shared`.
2. Update `POLICY` to define role-based rules and ownership logic.
3. Inject `PermissionService` (or `CirclePermissionService` for circle features) into the service constructor.
4. Use typed methods (e.g., `permission.assertCan("post", "delete", user, post)`) in the service.

**Example in a service:**

```ts
export class PostCommandService {
  constructor(private permission: PermissionService) {}

  async deletePost(postId: string, user: AuthUser): Promise<void> {
    const post = await PostRepository.findPostById(postId);
    if (!post) throw new PostNotFoundError();
    this.permission.assertCan("post", "delete", user, post);
    await PostRepository.deletePost(postId);
  }
}
```

**Benefits:**

- Consistent structure for new features.
- Centralized, type-safe permission enforcement.
- Fully mockable in tests — no `vi.mock("...rbac.js")` needed.

---

## 12. Testing Philosophy & Setup

Uses **Vitest** with focus on **controller integration**:

- Tests full request-to-response flow.
- Internal helpers tested indirectly through controllers.
- Directory mirrors source for discoverability.

**Run tests:**

```bash
npm run test --workspace backend
npm run test:ui --workspace backend
```

---

## 13. Seeding Strategy

Multi-phased, deterministic seeding ensures **realistic data**:

- Seeders run sequentially across 13 phases: cleanup → tags → avatars → users → posts → comments → likes → bookmarks → report reasons → reports → circle avatars → circles → notifications.
- Data generated with `@faker-js/faker`.
- Bulk inserts used with retries for constraints.
- Self-interaction and referential safety enforced.

**Run seeders:**

```bash
npm run db:seed --workspace backend
```

This results in **consistent, realistic development and test data**.

---
