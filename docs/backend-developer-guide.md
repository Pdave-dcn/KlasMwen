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
    ├── core/        # Config, logging, error handling
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

- Executes **middleware** (logging, rate limiting, auth).
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
- Secrets managed via env variables; never committed.

---

## 8. Request Logging & Context Tracing

Structured logs with unique **request IDs** for each incoming request:

```ts
req.logContext = { module: moduleName, requestId, ip: req.ip ?? "unknown" };
```

Enables **traceable, correlated logs** across requests.

---

## 9. Testing Philosophy & Setup

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

## 10. Seeding Strategy

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
