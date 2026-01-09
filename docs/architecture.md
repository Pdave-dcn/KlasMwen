# KlasMwen Architecture Overview

## 1. Purpose

This document provides an in-depth look at **KlasMwen’s architecture**, explaining how different components interact, how data flows through the system, and the rationale behind key design decisions.

While the main README offers a high-level summary, this document focuses on **how and why** specific architectural patterns, tools, and integrations were chosen.

---

## 2. System Overview

KlasMwen follows a **modular monorepo architecture**, housing both frontend and backend projects under a single repository. Each workspace is designed for separation of concerns while allowing seamless coordination.

### High-Level Diagram

```bash
+-------------------+
| User Browser / App|
+-------------------+
          |
          | HTTP/HTTPS
          v
+---------------------------+
| Frontend (React + Vite +  |
| shadcn)                   |
+---------------------------+
          |
          | API Calls
          v
+---------------------------+
| Backend (Node.js + Express|
| + Prisma)                 |
+---------------------------+
    |           |          |
    |           |          |
    v           v          v
+--------+  +---------+  +-----------------------+
|PostgreSQL|  | Cloudinary |  | Authentication    |
|Database  |  |           |  | (JWT + Passport)  |
+--------+  +---------+  +-----------------------+
          ^
          |
          | Static Assets
          |
+---------+
| Cloudinary|
+---------+
```

### Components Overview

| Layer              | Technology Stack                                             | Description                                                                        |
| ------------------ | ------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| **Frontend**       | React 19, Vite, TailwindCSS, shadcn/ui, Zustand, React Query | Handles UI, routing, and state management. Communicates with backend via REST API. |
| **Backend**        | Node.js, Express 5, Prisma ORM, Zod, Passport.js             | Manages authentication, business logic, and data persistence.                      |
| **Database**       | PostgreSQL                                                   | Stores structured data such as users, posts, comments, and tags.                   |
| **Storage**        | Cloudinary                                                   | Hosts uploaded files (documents, PDFs, etc.) via API integration.                  |
| **Docs & Testing** | Swagger (OpenAPI), Vitest, ESLint                            | API documentation and testing setup for reliability.                               |

---

## 3. Backend Architecture

The **KlasMwen backend** is built with a clear and scalable **feature-based modular architecture** powered by **Express**, **TypeScript**, and **Prisma ORM**. The structure emphasizes separation of concerns, reusability, and maintainability.

---

### Backend Folder Structure Overview

```bash
backend/
├── prisma/                     # Prisma schema, migrations, and seeds
└── src/
    ├── app.ts                  # Express app initialization
    ├── index.ts                # Entry point for the backend server
    ├── controllers/            # Request handlers mapped to routes
    │   └── avatar.controller.ts
    ├── core/                   # Core configuration and utilities
    │   ├── config/             # Server-level configurations
    │   │   ├── strategies/     # Passport strategies (JWT, Local)
    │   │   ├── cloudinary.ts   # Cloudinary setup for media storage
    │   │   ├── cors.ts         # CORS setup
    │   │   ├── logger.ts       # Pino logging configuration
    │   │   └── db.ts           # Prisma client instance
    │   │   └── passport.ts     # Passport initializer
    │   └── error/              # Centralized error handling system
    │       ├── index.ts        # Main error handler
    │       ├── handlers/       # Specialized error types (e.g., Validation, Auth)
    │       └── custom/         # Custom error classes (e.g., PostNotFoundError)
    ├── features/               # Core domain logic divided by feature
    │   ├── avatar/             # Avatar module (upload, retrieve, delete)
    │   ├── comment/            # Comment module (create, reply, delete)
    │   ├── user/               # User management and profile operations
    │   ├── post/               # Post creation, reading, updating, deleting
    │   ├── media/              # File/media handling and storage
    │   └── tag/                # Tag management
    ├── middlewares/            # Express middleware (auth, validation, rate limiting)
    ├── routes/                 # API route definitions and module mounting
    ├── seeds/                  # Database seed scripts (e.g., default users, posts)
    ├── swagger/                # Swagger/OpenAPI configuration setup
    ├── utils/                  # Helper functions shared across modules
    └── zodSchemas/             # Zod validation schemas for requests/responses

```

---

### Core Design Principles

- **Feature-based organization:** Each feature (e.g., posts, comments, users) encapsulates its business logic, making it easier to maintain and scale.
- **Separation of concerns:** Core configurations, middlewares, routes, and utilities are isolated for clarity.
- **Error management:** Centralized under `core/error`, ensuring consistent error handling throughout the application.
- **Type safety:** TypeScript is used end-to-end for better reliability and maintainability.
- **Validation:** All input validation is done using **Zod**, ensuring data integrity at runtime.
- **socket.io** – Real-time, bidirectional communication

---

### Request Lifecycle Example

1. **Request Entry** → Incoming request hits a defined route in `routes/`.
2. **Rate Limiting Middleware** → The request is evaluated against rate limits to prevent abuse.
3. **Authentication Middleware (`requireAuth`)** → JWT is validated and the authenticated user is attached to the request context.
4. **Authorization Middleware (`requireRole`)** → User roles are checked if the route is restricted to specific roles.
5. **Controller Layer** → The controller handles input extraction and delegates work to the appropriate feature service.
6. **Feature Logic** → The service in `features/` performs the necessary business logic (e.g., creating a post, fetching comments).
7. **Database Access** → Prisma interacts with PostgreSQL for data persistence.
8. **Response or Error** → On success, data is returned to the client. On failure, the controller calls `next(error)`, forwarding the error to the centralized `errorMiddleware` for handling.

---

### Example Flow — Creating a Post

```bash
Request (POST /api/posts)
   ↓
Routes
   ↓
Rate Limiter
   ↓
requireAuth (JWT validation)
   ↓
requireRole (if role-restricted)
   ↓
Controller
   ↓
Post Service
   ↓
Prisma (DB)
   ↓
Response (Created Post JSON)
        or
Error → next(error) → errorMiddleware
```

This design pattern ensures that:

- middleware responsibilities are clearly separated
- authentication and authorization are enforced consistently
- business logic remains centralized in services
- errors are predictable and handled in one place
- new features can be added with minimal friction

---

## 4. Frontend Architecture

The **KlasMwen frontend** is built with **React 19**, **Vite**, and **TypeScript**, following a **feature-oriented and component-driven** structure for clarity, scalability, and reusability.

---

### Frontend Folder Structure Overview

```bash
frontend/
├── src/
│   ├── api/                     # Axios instance and API modules
│   │   ├── api.ts               # Axios base instance setup
│   │   ├── auth.api.ts          # Auth-related API calls
│   │   ├── user.api.ts          # User-related API calls
│   │   ├── post.api.ts          # Post-related API calls
│   │   └── comment.api.ts       # Comment-related API calls
│   ├── components/              # Reusable UI components (buttons, modals, etc.)
│   ├── contexts/                # React context providers (e.g., theme, auth)
│   ├── features/                # Feature-specific UI and logic (posts, comments, etc.)
│   ├── hooks/                   # Custom reusable hooks
│   ├── lib/                     # Utility libraries (e.g., constants, permissions)
│   ├── pages/                   # Page-level components (routed views)
│   ├── queries/                 # TanStack Query hooks organized by domain
│   │   ├── profile.query.ts     # User profile-related queries
│   │   ├── comment.query.ts     # Comment fetching/mutation queries
│   │   └── post.query.ts        # Post fetching/mutation queries
│   ├── stores/                  # Zustand stores for global state
│   ├── types/                   # Shared TypeScript types and interfaces
│   ├── utils/                   # Helper functions
│   ├── zodSchemas/              # Zod validation schemas and inferred types (aligned with backend)
│   ├── App.tsx                  # Root application component
│   └── main.tsx                 # Application entry point
```

---

### Key Design Decisions

- **shadcn/ui + TailwindCSS** → Provides a consistent, accessible, and elegant UI foundation.
- **TanStack Query (React Query)** → Manages server state and caching efficiently for all async data.
- **Zustand** → Lightweight global state management for auth, modals, and UI state.
- **React Hook Form + Zod** → Simplifies form handling and ensures type-safe validation matching backend rules.
- **Feature-based organization** → Keeps code modular, making each feature (auth, posts, comments, etc.) self-contained.
- **Markdown Support** → Enables rich text editing for posts, study materials, and notes.

---

### Data Flow Overview

```bash
[User Interaction]
      ↓
[React Components]
      ↓ (hooks)
[TanStack Query / API modules]
      ↓ (HTTP requests)
[Backend API (Express + Prisma)]
      ↓
[Database / Cloudinary]
```

This approach ensures a clear separation between **presentation**, **data fetching**, and **business logic**, making the frontend easy to extend, debug, and maintain.

---

## 5. Data Flow

```bash
        ┌──────────────────────────┐
        │        User Action       │
        └────────────┬─────────────┘
                     │
                     ▼
        ┌──────────────────────────┐
        │   Frontend – React (UI)  │
        └────────────┬─────────────┘
             API Request │
                         ▼
        ┌──────────────────────────┐
        │  Backend – Express (API) │
        └────────────┬─────────────┘
             Business Logic │
                            ▼
        ┌──────────────────────────┐
        │     Service Layer        │
        └──────┬──────────┬────────┘
               │          │
     Database Query   File Upload
           │               │
           ▼               ▼
 ┌─────────────────┐   ┌─────────────────┐
 │  PostgreSQL DB  │   │    Cloudinary   │
 └─────────────────┘   └─────────────────┘
           ▲               ▲
           │               │
           └──────┬────────┘
                  │
         JSON Response / Data
                  │
                  ▼
        ┌──────────────────────────┐
        │   Frontend – React (UI)  │
        └────────────┬─────────────┘
                     │
                     ▼
        ┌──────────────────────────┐
        │       Render UI          │
        └──────────────────────────┘
```

- **Posts, Comments, and Tags**: Follows a relational model in PostgreSQL managed via Prisma.
- **File Uploads**: Files are first processed by Multer and then uploaded to Cloudinary.
- **Error Handling**: Consistent structure ensures the frontend can properly handle and display validation or server errors.

---

## 6. Security Considerations

- **JWT Authentication**: Tokens stored as HTTP-only cookies to prevent XSS.
- **CORS Configuration**: Origin is restricted using `ALLOWED_ORIGIN` env variable.
- **Rate Limiting**: Managed by `express-rate-limit` to mitigate abuse.
- **Validation**: All user input validated through Zod.

---

## 7. Scalability and Future Improvements

- **AI-Powered Assistance**: Potential integration for automated question answering.
- **Caching Layer**: Redis could be introduced for session caching or feed performance.

---
