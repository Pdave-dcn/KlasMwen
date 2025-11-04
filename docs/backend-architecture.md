# KlasMwen Backend Architecture & Developer Guide

This document provides an in-depth overview of the **KlasMwen backend**, its internal architecture, and the design principles guiding its development. It explains how the major layers services, validation, authentication, configuration, and seeding interact to form a clean, modular, and scalable backend system.

---

## Table of Contents

1. [Backend Structure & Flow](#1-backend-structure-and-flow)
2. [Request Lifecycle: CSR Flow](#2-request-lifecycle-csr-flow)
3. [Service Layer Design: Business Logic Core](#3-service-layer-design-business-logic-core)
4. [Authentication & Security (JWT, Cookies)](#4-authentication--security-jwt-cookies)
5. [Validation Layer (Zod)](#5-validation-layer-zod)
6. [Core Modules: Centralized Error Handling](#6-core-modules-centralized-error-handling)
7. [Configuration & Environment](#7-configuration--environment)
8. [Request Logging & Context Tracing](#8-request-logging--context-tracing)
9. [Testing Philosophy: Controller Integration](#9-testing-philosophy-controller-integration)
10. [Seeding Strategy](#10-seeding-strategy)

---

## 1. Backend Structure And Flow

The backend is written in **TypeScript** using **Express 5** and **Prisma ORM**.
It follows a **modular architecture** built around _features_ with a clear **separation of concerns**.

### Folder Structure

```bash
backend/
├── prisma/                 # Prisma schema, migrations, and seed data
└── src/
    ├── controllers/        # Route handlers (thin layer)
    ├── core/
    │   ├── config/         # Server setup: passport, pino, cors, cloudinary, db
    │   ├── errors/         # Custom errors, handlers, and global error resolver
    │   └── ...             # Other foundational modules
    ├── features/           # Domain-specific logic (post, comment, user, etc.)
    ├── middlewares/        # Auth, rate limiting, logging context
    ├── routes/             # API route definitions
    ├── seeds/              # Database seed scripts
    ├── swagger/            # OpenAPI/Swagger documentation
    ├── tests/              # Vitest test suites
    ├── utils/              # Utility helpers
    ├── zodSchemas/         # Zod validation schemas
    ├── app.ts              # Express app initialization
    └── index.ts            # Entry point
```

### Architectural Flow

```bash
Request → Middleware → Controller → Service → Repository → Prisma → Response
```

- **Controllers** – Receive HTTP requests and map them to service calls.
- **Services** – Contain the business logic (e.g., creating posts, handling comments).
- **Repositories** – Handle raw data access (usually Prisma queries).
- **Transformers / Enrichers** – Decorate or reshape data before returning it.
- **Zod Schemas** – Validate input.

---

## 2. Request Lifecycle: CSR Flow

The API follows a strict, **unidirectional data flow**, ensuring every request passes through designated layers for **security, validation, business logic**, and **error handling**. This is implemented via a **Controller-Service-Repository (CSR)** pattern.

### Fundamental Flow

```bash
Client → Middleware (Security, Logging, Rate-Limiter) → Controller → Service → Repository → Prisma → Response
```

---

### 1. The Controller Layer: Orchestration

The **Controller** acts as the traffic cop — it handles input and output but executes **no core business logic**.

#### Execution Steps in the Controller

1. **Middleware Execution:**
   The request first passes through global middleware (e.g., logging, rate limiting) and route-specific middleware (e.g., authentication, authorization).

2. **Authentication Check:**
   The controller immediately calls an enforcement utility (e.g., `ensureAuthenticated(req)`), which verifies the `req.user` object populated by authentication middleware. If invalid, an `AuthenticationError` is thrown.

3. **Validation:**
   Input data (params, body, query) is validated using **Zod schemas** (e.g., `PostIdParamSchema.parse(req.params)`). If validation fails, a `ZodError` is thrown.

4. **Service Call:**
   Once inputs are safe, the controller calls the appropriate method on the Service class (e.g., `CommentService.createComment(...)`).

5. **Response:**
   The successful data returned by the Service is wrapped in a standardized JSON structure with the appropriate HTTP status code (e.g., `201 Created`).

#### Logging in the Controller

The controller uses detailed logging mechanisms (`createLogger`, `createActionLogger`) to track performance and context:

- **Start & End:** Logs are generated at the start and end of each controller function.
- **Time Tracking:** Timers (`startTime`, `serviceDuration`, `totalDuration`) measure execution speed, which is logged for performance monitoring.

---

### 2. Service and Data Layers

The **Service** and **Repository** layers handle the core work:

- **Service Layer:** Executes the business rules (e.g., verifying comment parent ID, ensuring a post exists). Throws specific custom errors (e.g., `PostNotFoundError`).
- **Repository Layer:** Contains pure data access logic, translating service requests into optimized Prisma queries.
- **Prisma:** The ORM that interacts with the underlying database.

---

### 3. Asynchronous Error Handling

All controller logic is wrapped in a single `try/catch` block to handle synchronous and asynchronous errors uniformly:

```ts
// ... inside the controller function
} catch (error: unknown) {
  return handleError(error, res);
}
```

#### Error Types

- **Custom Errors:** When business rules fail (e.g., expired post edits, resource not found), the Service layer throws a custom error (e.g., `PostUpdateFailedError`).
- **Third-Party Errors:** Errors from **Zod**, **Multer**, **Prisma**, or **JWT** are also caught here.
- **Centralized Delegation:** The `handleError(error, res)` function (see Section 5) identifies the error type and delegates it to a specialized handler, returning a **standardized error response**.

---

### 4. Response Serialization

Successful responses adhere to a consistent **JSON structure**, ensuring that clients always know how to interpret the payload:

```json
{
  "message": "Comment created successfully",
  "data": {
    "id": "...",
    "content": "..."
    // ... complete enriched comment data
  }
}
```

This wrapper ensures consistency whether the response contains a **single object** or a **paginated list**, simplifying **client-side consumption**.

---

## 3. Service Layer Design: Business Logic Core

Services are the **core business logic** of the backend. They implement a highly structured, layered pattern known as the **Service Layer Architecture** to ensure a clean separation between data access, data manipulation, and orchestration.

Each major feature module (like posts, users, or comments) has a dedicated service class that orchestrates these operations.

---

### Layered Service Architecture

This design separates concerns into **four distinct layers** within each feature module:

| Component          | Responsibility                 | Purpose                                                                                                                                                             |
| ------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PostService.ts** | Orchestration & Business Logic | Manages the workflow, handles authorization checks, applies core business rules (e.g., edit time windows), and calls the other layers.                              |
| **repositories/**  | Data Access (DAO)              | Contains pure Prisma queries. It is responsible only for fetching, counting, and modifying raw database entities. No business logic or data transformation allowed. |
| **transformers/**  | Data Shaping & Normalization   | Takes raw data from the repository and shapes it for application use (e.g., flattening nested Prisma objects, truncating content for previews).                     |
| **enrichers/**     | Derived Data & Context         | Adds contextual or computed information based on the current user (e.g., checking if the `currentUserId` has liked or bookmarked a post).                           |

---

### Directory Structure

Each feature (like `post`) maintains a clear, modular structure:

```bash
features/post/service
├── PostService.ts         # Core orchestration and rules
├── repositories/          # Prisma-based data access (*Repository.ts)
├── enrichers/             # Adds user-specific state (*Enricher.ts)
├── transformers/          # Shapes and normalizes data (*Transformer.ts)
└── types/                 # Prisma selectors, complex response types
```

---

### Example: The Core Post Retrieval Workflow

The `PostService`'s primary job is to manage the flow of data through these components. For a complex task like fetching a list of posts, the flow is:

1. **Service (Orchestration):** `PostService.getPostsAndProcess` defines the necessary sequence of operations.
2. **Repository (Fetch):** `PostRepository.findManyPosts` fetches the raw post data from the database using optimized Prisma queries.
3. **Transformer (Shape):** `PostTransformer.transformPosts` normalizes the raw data into a consistent internal format (`TransformedPost`).
4. **Enricher (Context):** `PostEnricher.getBookmarkAndLikeStates` fetches the current user's interaction states (likes, bookmarks) in bulk.
5. **Enricher (Apply):** `PostEnricher.enrichPostsWithStates` merges the interaction states onto the transformed posts (resulting in an `EnrichedPost`).
6. **Service (Finalize):** The enriched, processed data is returned to the controller with pagination metadata.

```ts
class PostService {
  private static async getPostsAndProcess(...) {
    // 1. Fetch raw data
    const posts = await PostRepository.findManyPosts(...);

    // 2. Transform/Shape data
    const transformedPosts = PostTransformer.transformPosts(...);

    // 3. Get contextual states
    const states = await PostEnricher.getBookmarkAndLikeStates(...);

    // 4. Enrich final output
    const enrichedPosts = PostEnricher.enrichPostsWithStates(
      transformedPosts,
      states,
      currentUserId
    );

    // 5. Finalize and paginate
    return processPaginatedResults(enrichedPosts, ...);
  }
}
```

---

### Why This Matters

- Keeps **controllers thin** — only routing, validation, and response handling.
- **Single Responsibility Principle (SRP):** Each class has exactly one job (data access, transformation, enrichment, or orchestration), making changes safe and predictable.
- Each concern (fetching, enriching, transforming) is **independently testable**.
- Simplifies debugging, since logs and stack traces remain scoped per module.

---

## 4. Authentication & Security (JWT, Cookies)

The application utilizes **Passport.js** as its primary authentication middleware, implementing a **stateless, JWT-based authorization model** secured via cookies.

---

### Authentication Strategies

Two primary Passport strategies are used, each serving a distinct purpose:

#### 1. Local Strategy (Login)

The **Local Strategy** is used exclusively for the initial user sign-in process (`/login`).

**Credential Verification:** Uses the user-provided email and password to authenticate.

**Password Handling:** Passwords are never stored in plain text.

- **Registration:** The `UserService.hashPassword` method uses `bcryptjs` to hash passwords with a 12-round salt before creation.
- **Login:** The strategy asynchronously compares the provided password against the stored hash using `bcrypt.compare`.

**Stateless Authentication:** The authentication is executed with `{ session: false }`, ensuring no server-side session is created. If verification succeeds, the user object is passed to a custom callback (`handleAuthenticationResult`).

---

#### 2. JWT Strategy (Authorization)

The **JWT Strategy** authorizes subsequent requests after a user has logged in.

**Token Extraction:** Instead of using the `Authorization: Bearer` header, a custom function (`cookieExtractor`) retrieves the JWT directly from the request's cookies.

**Validation Flow:**

1. The token is extracted from the `token` cookie.
2. The token is verified against the secure `JWT_SECRET`.
3. The payload (`id`, `username`, `email`, `role`) is extracted.
4. A database lookup via `prisma.user.findUnique` ensures the user exists and their state is valid.

**Setting `req.user`:** Upon successful verification, Passport populates `req.user` with the user's data, enabling role and permission checks (e.g., `req.user.id`, `req.user.role`).

---

### Stateless Session & Secure Cookies

The system uses a **completely stateless authentication model**, relying solely on the validity of the client-side JWT.

#### The Role of httpOnly Cookies

Upon successful login or registration, the server generates a signed JWT (containing user metadata) and returns it via a secure cookie:

| Cookie Option          | Description                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| **`httpOnly: true`**   | Prevents client-side JavaScript (including XSS) from accessing or stealing the JWT.          |
| **`secure: true`**     | Ensures the cookie is sent only over HTTPS (enabled in production).                          |
| **`sameSite: 'none'`** | Allows cookies to be sent cross-domain (for setups like `frontend.app.com` ↔ `api.app.com`). |
| **`maxAge`**           | Sets the token’s expiration (e.g., 3 days).                                                  |

This approach ensures **strong protection against XSS and CSRF attacks**, while maintaining user session persistence.

---

### Route Guarding Middleware

Routes that require authentication are protected using Passport’s built-in middleware.

**Main Middleware:**

```ts
passport.authenticate("jwt", { session: false });
```

**Example Implementation:**

```ts
// Example Router Definition
router.post(
  "/posts/:id/comments",
  passport.authenticate("jwt", { session: false }), // <--- JWT Guard
  createComment
);
```

**When this guard is hit:**

1. Passport runs the JWT strategy.
2. If the token is missing, expired, or invalid → a `401 Unauthorized` response is sent immediately.
3. If valid → `req.user` is populated, and execution continues to the controller (`createComment`).

---

### Summary

- **Local Strategy:** Handles login authentication.
- **JWT Strategy:** Handles authorization for protected routes.
- **httpOnly Cookies:** Securely store tokens, protecting from client-side access.
- **Stateless Sessions:** No session storage needed — all state is encoded in JWT.
- **Route Guards:** Enforce security consistently across the API.

---

## 5. Validation Layer (Zod)

The server uses **Zod** as the primary library for defining and enforcing runtime data validation. This approach is crucial for achieving **high data integrity** and providing **clear, structured feedback** to API clients.

---

### The Role of Zod

Zod is a **TypeScript-first schema validation library**. Its main benefits in this project include:

- **Runtime Validation:** Ensures that incoming request bodies, URL parameters, and query strings conform to expected formats, protecting the business logic from malformed data.
- **Type Safety & Inference:** Since Zod is TypeScript-first, schemas automatically infer TypeScript types — for example:

  ```ts
  type ValidatedPostUpdateData = z.infer<typeof UpdatedPostSchema>;
  ```

  This guarantees that the data passed to the service layer is strongly typed and safe to use.

---

### Validation Structure and Flow

All Zod schemas are centrally located in the `src/zodSchemas/` directory, organized by feature module — e.g., `post.zod.ts`, `user.zod.ts`, `auth.zod.ts`.

#### 1. Schema Sharing (Frontend/Backend)

While primarily used on the backend for API validation, the schemas are designed for **potential sharing with the frontend**, allowing:

- **Form validation before submission (optimistic validation)**
- **Consistent validation logic** between frontend and backend — reducing bugs caused by mismatched schema definitions

#### 2. Input Validation Flow

The validation layer operates immediately after a request is received and authentication is confirmed, but **before the business logic executes**. This ensures that the service layer only processes verified, clean data.

**Validation Pipeline:**

```bash
REQUEST → AUTHENTICATION → VALIDATION (Zod) → SERVICE LAYER (Business Logic)
```

When validation fails, a `ZodError` is thrown and caught by the global error handler, which returns a standardized `400 Bad Request` response with detailed, field-level errors.

---

### Example: Complex Schema Definition

Complex operations — such as creating a new post, which can have multiple types (`QUESTION`, `NOTE`, `RESOURCE`) — leverage **Zod’s discriminated union** feature to handle type-specific validation rules.

```ts
// Define base fields
const BasePostSchema = z.object({
  title: z.string().trim().min(5).max(100),
  type: z.enum(["QUESTION", "NOTE", "RESOURCE"]),
  tagIds: z.array(z.number().int().positive()).max(10).default([]),
});

// Schema for text-based posts (requires 'content')
const TextPostRequestSchema = BasePostSchema.extend({
  type: z.enum(["QUESTION", "NOTE"]),
  content: z.string().trim().min(10).max(5000),
}).strict();

// Schema for resource posts (no 'content' required)
const ResourcePostRequestSchema = BasePostSchema.extend({
  type: z.literal("RESOURCE"),
}).strict();

// Combine with discriminated union
const NewPostRequestSchema = z.discriminatedUnion("type", [
  TextPostRequestSchema,
  ResourcePostRequestSchema,
]);
```

**Outcome:** The API enforces that:

- `content` **is required** for `QUESTION` and `NOTE` post types
- `content` **is disallowed** for `RESOURCE` posts

This pattern creates **explicit, reliable API contracts** and prevents clients from sending invalid or ambiguous payloads.

---

## 6. Core Modules: Centralized Error Handling

### `/core/config/`

Centralized configuration for third-party services and runtime setup:

- **`db.ts`** → Prisma client setup
- **`passport.ts`** → Authentication strategies (JWT, local)
- **`logger.ts`** → Pino logger configuration
- **`cloudinary.ts`** → File upload and management
- **`cors.ts`** → CORS policy setup

### `/core/error/` - **Centralized Error Handling**

The `/core/error` module is the single source of truth for all error handling across the server. It implements a **consistent and predictable error response strategy** by separating custom application errors from third-party/system errors and processing them through specialized handlers.

#### Custom Errors (`/core/error/custom`)

- **`BaseCustomError` base class**: Extends the native JavaScript `Error` class and is the foundation for all application-specific errors. It enforces the presence of an `abstract statusCode: number` property.

  - **Benefit**: Allows developers to throw a specific error (e.g., `PostNotFoundError`) and guarantee the central handler will use the correct **HTTP status code** (e.g., `404`) and message without manual status setting in the controller.

- **Custom errors like `PostNotFoundError`,** `AuthorizationError`: Concrete classes extending `BaseCustomError`, ensuring domain-specific and descriptive errors are used (e.g., `AuthenticationError` for `401`, `AuthorizationError` for `403`).

#### Centralized Error Handler (`/core/error/index.ts`)

- `handleError(error: unknown, res: Response)`: The main orchestration function, designed to be called in every controller's `catch` block.

- It logs the error (including contextual request info via the `contextLogger`), and then uses a series of `instanceof` and name checks to delegate the error to the correct specialized handler in order of specificity:

  1. **Custom Errors**: Handled directly via `BaseCustomError`'s `statusCode`.

  2. **Validation Errors (Zod)**: Delegated to `ValidationErrorHandler`.

  3. **File/Upload Errors (Multer)**: Delegated to `FileUploadErrorHandler`.

  4. **Database Errors (Prisma)**: Delegated to specific methods within `DatabaseErrorHandler` for `KnownRequestError`, ValidationError, etc.

  5. **Authentication Errors (JWT/bcrypt)**: Delegated to `AuthErrorHandler`.

  6. **Generic/Unknown Errors**: Handled by the fallback `GenericErrorHandler`.

#### Specialized Handlers (`/core/error/handlers`)

- These classes (e.g., `AuthErrorHandler`, `ValidationErrorHandler`) are responsible for translating complex third-party library errors into a **simplified, standardized JSON response** for the client.

  - **Example (Zod)**: The `ValidationErrorHandler` converts a detailed `ZodError` object into a clean `400 Bad Request` response that includes a user-friendly array of field-level errors.

  - **Example (JWT)**: The `AuthErrorHandler` maps generic `JsonWebTokenError` and `TokenExpiredError` names into specific messages like "Token has expired." and the correct `401 Unauthorized` status.

```ts
class ValidationErrorHandler {
  // Zod validation errors
  static handleValidationError(error: ZodError) {
    return {
      status: 400,
      response: {
        message: "Validation failed",
        errors: error.issues.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        })),
      },
    };
  }
}

class AuthErrorHandler {
  // Handle JWT Errors
  static handleJWTError(error: Error) {
    if (error.name === "TokenExpiredError") {
      return {
        status: 401,
        response: {
          message: "Token has expired. Please log in again.",
        },
      };
    }
    if (error.name === "JsonWebTokenError") {
      return {
        status: 401,
        response: {
          message: "Invalid token. Please log in again.",
        },
      };
    }
    if (error.name === "NotBeforeError") {
      return {
        status: 401,
        response: {
          message: "Token not active yet.",
        },
      };
    }
    return {
      status: 401,
      response: {
        message: "Authentication failed.",
      },
    };
  }

  // Handle bcrypt errors
  static handleBcryptError(error: Error) {
    console.error("Bcrypt Error:", error.message);
    return {
      status: 500,
      response: {
        message: "Password processing error.",
      },
    };
  }
}
```

This layered structure ensures **separation of concerns**, making the error logic **testable, maintainable, and highly consistent** across the entire API.

---

## 7. Configuration & Environment

The application follows **12-Factor App** principles by strictly externalizing all configuration into the environment. This ensures that the codebase remains portable and deployable across **development**, **staging**, and **production** environments without modification.

---

### 1. Environment Variable Loading (.env & dotenv)

All environment-specific variables are managed through OS-level environment variables. For local development, the **dotenv** library is used to read configuration keys and values from a local `.env` file and load them into `process.env`.

#### Variables Used

- **PORT** — API listening port
- **DATABASE_URL** — PostgreSQL connection string (used by Prisma)
- **JWT_SECRET** — Secret for signing and verifying JWTs
- **CLOUDINARY_CLOUD_NAME**, **CLOUDINARY_API_KEY**, **CLOUDINARY_API_SECRET** — Cloudinary credentials

#### Variable Access

All configuration is accessed directly through `process.env`, ensuring clear, explicit usage throughout the codebase.

---

### 2. Configuration File Structure

The `src/core/config/` directory centralizes all configuration logic. This directory is responsible for initializing and managing third-party services, external APIs, and key infrastructure components.

| File Path         | Purpose                                          |
| ----------------- | ------------------------------------------------ |
| **db.ts**         | Initializes and exports the Prisma Client        |
| **passport.ts**   | Registers authentication strategies (JWT, Local) |
| **logger.ts**     | Configures the global Pino logger                |
| **cloudinary.ts** | Initializes Cloudinary SDK with secrets          |
| **cors.ts**       | Defines CORS policy and allowed origins          |

This design isolates configuration setup from business logic, improving readability and maintainability.

---

### 3. Server Startup Verification (Pre-Flight Checks)

Before starting the Express server, a set of **pre-flight checks** are executed to verify that all required services and environment variables are properly configured.

#### Key Startup Checks

- **Database Verification:** Calls `prisma.$connect()` to confirm a valid connection to PostgreSQL.
- **Cloudinary Verification:** Uses `verifyCloudinaryConnection()` to ensure the Cloudinary API credentials are present and functional.
- **Logging:** Detailed logs are emitted during each step of startup, including timestamps and duration metrics for diagnosing startup performance.

If any verification fails, the server startup process is **aborted early** to prevent inconsistent states in production.

---

### 4. Secrets Management

All secrets, including **database credentials**, **API keys**, and **JWT secrets**, are fully managed through environment variables.

#### Runtime Validation

While there is no Zod-based validation schema for environment variables, their presence and validity are implicitly verified during startup. For example:

- Missing `JWT_SECRET` throws an immediate initialization error.
- Invalid or missing Cloudinary keys cause the `verifyCloudinaryConnection` check to fail.

#### Security Best Practices

- **Never commit secrets** to the repository.
- For production, manage sensitive data using secure tools such as:

  - Docker Secrets
  - Kubernetes Secrets
  - AWS Secrets Manager
  - GCP Secret Manager

All secrets are injected at runtime to maintain the app’s portability and compliance with best security practices.

---

## 8. Request Logging & Context Tracing

To make debugging easier in production, KlasMwen includes a **logging context middleware** that attaches a traceable ID to each incoming request.

This middleware provides **structured, contextual logging** via Pino:

```ts
const attachLogContext = (moduleName: string) => {
  return (req, _res, next) => {
    const requestId =
      (req.headers["x-request-id"] as string) ??
      `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    req.logContext = {
      module: moduleName,
      requestId,
      ip: req.ip ?? "unknown",
    };

    next();
  };
};
```

**Why This Is Important:**

- Every request can be traced end-to-end (useful in multi-service environments).
- Logs include `requestId`, `module`, and `ip`, enabling **log correlation**.
- Integrates with Pino logger for structured output (JSON logs).

---

## 9. Testing Philosophy: Controller Integration

### Core Strategy: High-Fidelity Integration Testing

The backend utilizes **Vitest** for a rigorous testing approach focused primarily on **controller integration tests**. The philosophy is not to achieve 100% line coverage for every helper and utility function, but to guarantee that the application's business logic, as exposed by the API controllers, works **end-to-end**, as intended.

---

### Why Controller Integration?

#### Focus on Logic

Every public controller method (e.g., `createComment`, `updatePost`) is fully tested. This ensures that the entire flow, from request validation to database interaction, and finally, response generation is correct.

#### Implementation Agnostic

Helper functions and internal utilities are **not individually tested**. Instead, if a non-tested helper is modified and introduces a regression, the controller tests that rely on that helper will fail. This immediately signals a failure in **logic** (the behavior changed) rather than a failure in **implementation** (how it works internally).

#### Speed and Isolation

By mocking heavy external dependencies, the tests remain fast and isolated, executing as unit tests while providing the assurance of full integration.

---

### Testing Structure and Organization

The testing directory is structured to **mirror the source code** for ease of maintenance and discoverability:

```bash
src/tests/
├── controllers/
│   ├── comment/
│   ├── post/
│   └── user/
├── features/
├── core/
│
│
└── vitest.config.ts
```

---

### Running Tests

The primary command for running all backend tests is:

```bash
npm run test --workspace backend
```

You can also run tests in an interactive UI in a browser during development:

```bash
npm run test:ui --workspace backend
```

---

## 10. Seeding Strategy

The application employs a **multi-phased, deterministic seeding system** located in the `src/seeds/` directory. This ensures a consistently populated database for **development**, **integration testing**, and **demonstration** purposes.

---

### 1. Orchestration and Execution

The primary orchestration file is **`src/seeds/index.ts`**, which coordinates all seeding operations.

#### Key Components

- **Dependencies:** Imports all individual seeders (e.g., `seedUsers`, `seedPosts`) alongside the Prisma client, logger, and custom error classes.
- **Sequential Execution:** Each phase executes in order to preserve data dependencies (e.g., posts depend on users, tags must exist before posts are created).
- **Metrics and Logging:** Start/end times and per-phase durations are recorded with structured logs, providing transparency and easy performance tracking.
- **Error Handling:** A custom `SeedingError` ensures controlled failure behavior. When an error occurs, the failing phase and detailed context are logged before halting execution.

#### Run Command

```bash
npm run db:seed --workspace backend
```

---

### 2. Seeding Phases and Dependencies

The seeding process is divided into **eight phases**, executed sequentially to maintain referential integrity.

| Phase            | Seeder File          | Purpose & Dependencies                                                                                                     |
| :--------------- | :------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **1. Cleanup**   | `cleanup.seeder.ts`  | Ensures idempotency by deleting existing data (likes, comments, posts, users, etc.) in reverse dependency order.           |
| **2. Tags**      | `tag.seeder.ts`      | Creates predefined tag categories (e.g., _Algebra_, _World History_, _Programming_). Required by: Posts.                   |
| **3. Avatars**   | `avatar.seeder.ts`   | Generates both identicon and adventurer-style avatars using the Dicebear API via Faker.js. Used by: Users.                 |
| **4. Users**     | `user.seeder.ts`     | Creates ~10 users with hashed passwords (via bcryptjs) and random avatars. Required by: Posts, Comments, Likes, Bookmarks. |
| **5. Posts**     | `post.seeder.ts`     | Generates posts of different types (QUESTION, NOTE, RESOURCE) and attaches tags. Required by: Comments, Likes, Bookmarks.  |
| **6. Comments**  | `comment.seeder.ts`  | Builds hierarchical comment structures (root + nested replies) with probabilistic depth for realism.                       |
| **7. Likes**     | `like.seeder.ts`     | Adds likes between users and posts, ensuring no self-liking behavior.                                                      |
| **8. Bookmarks** | `bookmark.seeder.ts` | Populates user bookmarks while excluding authors from bookmarking their own posts.                                         |

---

### 3. Advanced Implementation Details

#### Realistic Mock Data

All data is generated with **`@faker-js/faker`**, providing:

- Authentic usernames, bios, and post titles.
- Natural comment threads and engagement patterns.
- Variable probabilities for likes, bookmarks, and replies.

#### Robust Batch Processing

For high-volume entities (e.g., Likes, Bookmarks):

- Bulk inserts are handled via `prisma.createMany` for speed.
- A fallback retry mechanism reattempts failed records individually when constraint violations occur.

#### Data Integrity Checks

Several safeguards ensure realistic and consistent data:

- **Self-interaction prevention:** Users cannot like or bookmark their own posts.
- **Referential safety:** Later phases check IDs from earlier ones to ensure valid relationships.
- **Progress reporting:** Each seeder logs its own creation count and duration.

---

This approach provides **predictable, high-quality data** that mirrors real-world usage patterns, greatly improving local development and integration test reliability.
