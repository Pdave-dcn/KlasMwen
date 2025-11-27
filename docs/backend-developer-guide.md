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
    ├── tests/       # Vitest suites
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

- Executes authentication.
- Validates inputs using **Zod schemas**.
- Calls **service methods**.
- Returns **standardized JSON responses**.
- Logs execution start, end, and duration for performance tracking.

### Service & Repository Layers

- **Service:** Enforces business rules, orchestrates repository and transformers.
- **Repository:** Handles raw database queries via Prisma.
- **Transformer/Enricher:** Shapes data and adds user-specific context.

### Error Handling in Controllers

All controllers wrap logic in `try/catch` blocks using `handleError(error, res)` for uniform error responses.

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

## 9. Role-Based Access Control (RBAC)

The backend implements a **type-safe, flexible RBAC system** using a **registry** and **policy** approach.

### Registry & Policy

- **`registry`** defines resources (e.g., `post`, `comment`) and actions (`create`, `read`, `update`, `delete`, `report`).
- **`POLICY`** maps roles to resources and actions, with values that are **boolean** or **functions** for dynamic checks (like ownership).

### Permission Functions

- **`hasPermission(user, resource, action, data?)`** → returns `true/false` depending on the user's rights.
- **`assertPermission(user, resource, action, data?)`** → throws `AuthorizationError` if permission is denied.

### Example Usage in Service

```ts
const user = ensureAuthenticated(req);
assertPermission(user, "post", "delete", post);
await PostRepository.delete(post.id);
```

- Fine-grained permission checks are typically done inside **services** using `assertPermission` or `hasPermission`.

### Benefits

- Centralized, type-safe permissions.
- Supports ownership and conditional access.
- Consistent enforcement across controllers, services, and even frontend checks.

---

## 10. Quick Start / How-To Guides

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
2. Import the relevant service methods.
3. Wrap logic in `try/catch` and use `handleError` for error handling.
4. Validate incoming requests with the corresponding Zod schema.
5. Return standardized JSON responses.

### 10.3 Add a Route

1. Define a route in `routes/moduleName.route.ts`.
2. Wrap the route with middleware if authentication or RBAC is required (`ensureAuthenticated`, `assertPermission`, etc.).
3. Connect route handlers from the controller.

### 10.4 Add Permission Checks

1. Update `registry` with the new resource and allowed actions.
2. Update `POLICY` to define role-based rules and ownership logic.
3. Use `hasPermission` in services or `assertPermission` to enforce backend checks.

**Example in a service:**

```ts
const user = ensureAuthenticated(req);
assertPermission(user, "post", "delete", post);
await PostRepository.delete(post.id);
```

**Benefits:**

- Consistent structure for new features.
- Centralized permission enforcement.
- Type-safe validation with Zod ensures runtime safety.

---

## 10. Testing Philosophy & Setup

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

## 11. Seeding Strategy

Multi-phased, deterministic seeding ensures **realistic data**:

- Seeders run sequentially: cleanup → tags → avatars → users → posts → comments → likes → bookmarks.
- Data generated with `@faker-js/faker`.
- Bulk inserts used with retries for constraints.
- Self-interaction and referential safety enforced.

**Run seeders:**

```bash
npm run db:seed --workspace backend
```

This results in **consistent, realistic development and test data**.

---
