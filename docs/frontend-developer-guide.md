# KlasMwen Frontend Architecture and Developer Guide

This document is a comprehensive guide to the **KlasMwen frontend**, aimed at helping **future you** and **new developers** quickly understand, navigate, and contribute to the codebase. It focuses on **implementation patterns**, **core design principles**, **how-to guides**, and **technology choices**.

---

## 1. Core Technology Principles

| Technology      | Role              | Design Rationale                                                                                                          |
| --------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **React 19**    | UI Library        | Modern features, excellent component model.                                                                               |
| **TypeScript**  | Language          | Enforces strict typing, catching errors early, especially crucial for API data.                                           |
| **Vite**        | Build Tool        | Extremely fast development server and optimized production builds.                                                        |
| **TailwindCSS** | Styling           | Utility-first approach for rapid, consistent, and responsive styling.                                                     |
| **shadcn/ui**   | Component Library | Accessible, customizable components built on Radix UI, eliminating dependency on large, opinionated component frameworks. |

> **Tip:** Whenever revisiting the project, remember: **React + TypeScript** enforces type safety, and **Tailwind + shadcn/ui** ensures consistent UI patterns.

---

## 2. Project Structure and Modularity

The `src/` directory follows **feature encapsulation** and **separation of concerns**.

### 2.1 Folder Breakdown

```bash
frontend/src/
├── api/                     # Axios API calls
├── components/              # Reusable, presentational UI elements
├── contexts/                # Global React Context providers
├── features/                # Smart feature containers
├── hooks/                   # Reusable custom React hooks
├── lib/                     # Utility libraries
├── pages/                   # Top-level route components
├── queries/                 # TanStack Query hooks for data fetching
├── stores/                  # Zustand global client state
├── types/                   # TypeScript types/interfaces
├── utils/                   # Helper functions
└── zodSchemas/              # Zod validation schemas
```

### 2.2 Components vs Features

- **`components/`**: Dumb, reusable UI elements. Receives all data via props. Avoid API or global state logic here.
- **`features/`**: Smart containers with self-contained logic for specific views. Manages its own state, consumes APIs via `queries/`, and renders components.

**Example feature folder:**

```bash
features/postView/
├── components/
│   ├── PostHeader.tsx
│   ├── PostContent.tsx
│   └── PostActions.tsx
└── utils/
    └── formatPostData.ts
```

> **Quick Tip:** Always isolate logic and components within features to maintain clarity and reusability.

---

## 3. Application Architecture & Routing Flow

### 3.1 Core Component Hierarchy

| Component            | Responsibility                     | Description                                                               |
| -------------------- | ---------------------------------- | ------------------------------------------------------------------------- |
| `App.tsx`            | Initialization & Top-Level Routing | Hydrates state, verifies authentication, defines routes.                  |
| `ProtectedRoute.tsx` | Auth Enforcement & Layout          | Wraps authenticated routes with `<Layout>`; redirects unauthorized users. |
| `Layout.tsx`         | Global UI Shell                    | Renders persistent UI elements and global modals.                         |

### 3.2 Authentication Verification Flow

**Steps:**

1. **State Hydration**: Wait for Zustand store to hydrate.
2. **Server Verification**: Validate session via `/auth/me`.
3. **Render UI / Redirect**: Show `<Spinner />` until complete; redirect if unauthorized.

```bash
# Legend:
# --> : flow
# []  : component or process
# ()  : external request or system

# Authentication & Routing Flow

[User Browser/App] -->|Open App| [App.tsx]
[App.tsx] -->|Check Hydration| [Zustand Store Hydration]
[Zustand Store Hydration] -->|Hydrated| [Server Session Verification (/auth/me)]
[Server Session Verification (/auth/me)] -->|Valid| [ProtectedRoute.tsx]
[Server Session Verification (/auth/me)] -->|Invalid| [Redirect to /]
[ProtectedRoute.tsx] -->|Authenticated| [Layout.tsx]
[Layout.tsx] --> [Render Protected Page Components]
```

### 3.3 Routing

- **Public Routes**: `/`, `/sign-in`, `/register`
- **Protected Routes**: `/home`, `/profile/me`, `/search`
- Use `<ProtectedRoute>` to enforce auth.

---

## 4. State Management

### 4.1 Server State (TanStack Query)

- Use `useQuery` for fetching.
- Use `useMutation` for updates and cache invalidation.
- Treat server as **single source of truth**.

**Example:**

```tsx
const { data } = useProfileQuery(userId);
```

### 4.2 Client State (Zustand)

- Authenticated user info, modal visibility, ephemeral UI state.
- Use selectors for performance.

> **Tip:** Never store server data in Zustand; always rely on React Query for API data.

---

## 5. UI & Styling

- **shadcn/ui + Radix UI**: Accessible, customizable, integrates with Tailwind.
- **TailwindCSS**: Utility-first, responsive breakpoints.

> **Quick Note:** Reuse components whenever possible; avoid creating multiple copies of similar UI elements.

---

## 6. Forms & Data Handling

**Form Trifecta:** React Hook Form + Zod + TanStack Query

- RHF: Manages form state and submissions.
- Zod: Client-side validation + TypeScript inference.
- React Query Mutation: Handles async submission.

**Example:**

```tsx
const form = useForm<PostFormValues>({
  resolver: zodResolver(PostCreationSchema),
});
```

- Unified error handling: client-side + server-side mapped to `formState.errors`.

> **Tip:** Always disable submit buttons while mutations are pending.

---

## 7. API Communication

- **Base Axios Instance** (`api/api.ts`) configured with base URL, JSON headers, credentials, and timeout.
- **Global Interceptors** handle errors (429, 401, 500, network errors) centrally.
- **Zod validation** ensures server response integrity.

**Flow:**

```bash
Component → queries → api/post.api.ts → api/api.ts → HTTP Request
```

> **Tip:** Never call Axios directly in components; always use queries or mutations.

---

## 8. Role-Based Permission System (RBAC)

- Type-safe, context-aware, flexible.
- Components: `registry`, `POLICY`, `hasPermission`.
- Handles UI rendering and API access.

**Usage Example:**

```tsx
if (hasPermission(user, "posts", "delete", post)) {
  return <Button variant="destructive">Delete</Button>;
}
```

> **Tip:** Add new permissions in `registry` and `POLICY` to maintain type safety.

---

## 9. Testing Strategy

- **Vitest** + **Testing Library**.
- Mirrors `src/` structure.
- **Focus Areas**: RBAC, API interactions, forms, global state, routing.

**Tiers:**

1. **Unit Tests**: Utilities and pure functions.
2. **Component Tests**: Presentational React components.
3. **Integration Tests**: User flows, API interactions.

**Example:**

```ts
expect(hasPermission(mockUser, "posts", "delete", mockPost)).toBe(true);
```

> **Tip:** Always mock API responses in integration tests; verify error handling and UI consistency.

---

## 10. Quick Start / How-To Guides

### 10.1 Add a New Feature

1. Create folder under `features/featureName/`.
2. Add `components/` and `utils/` inside.
3. Connect API calls via `queries/`.
4. Add routes in `App.tsx`.

### 10.2 Add a Form

1. Define Zod schema.
2. Set up RHF form with `zodResolver`.
3. Connect mutation hook.
4. Handle loading/errors as per Form Trifecta.

### 10.3 Add a Route

1. Add page component under `pages/`.
2. Wrap with `<ProtectedRoute>` if needed.
3. Update navigation (`Sidebar` / `MobileTabBar`).

### 10.4 Add Permission

1. Update `registry`.
2. Update `POLICY`.
3. Use `hasPermission` in components.

---

## 11. Tips & Gotchas

- Always validate server data with Zod.
- Modal state is global — manage centrally.
- Use queries/mutations for server communication; avoid direct Axios calls in components.
- `features/` = smart logic, `components/` = dumb UI.
- Remember: **React Query = server state, Zustand = client state.**

---

## 12. References / Cheat Sheet

| Folder       | Purpose                         |
| ------------ | ------------------------------- |
| `components` | Dumb reusable UI                |
| `features`   | Smart feature containers        |
| `queries`    | Data fetching hooks             |
| `stores`     | Client state via Zustand        |
| `zodSchemas` | Validation + inferred types     |
| `api`        | Axios requests + Zod validation |

> Use this cheat sheet for quick navigation through the frontend codebase.
