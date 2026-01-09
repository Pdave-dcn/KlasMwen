# KlasMwen — Educational Social App

![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-passing-blue)
![License](https://img.shields.io/github/license/Pdave-dcn/KlasMwen)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?logo=postgresql&logoColor=white)

![RBAC](https://img.shields.io/badge/Security-RBAC-purple)
![Validation](https://img.shields.io/badge/Validation-Zod-success)
![Real--Time](https://img.shields.io/badge/Realtime-Socket.IO-black?logo=socket.io)

[![Live Demo](https://img.shields.io/badge/demo-live-success?logo=netlify)](https://klasmwen.netlify.app/)

**KlasMwen** is an educational social platform designed to connect students, promote knowledge sharing, and support collective growth.

---

## Table of Contents

- [Overview](#overview)
- [Screenshots](#screenshots)
- [Key Features](#key-features)
- [Live Demo](#live-demo)
- [Tech Stack](#tech-stack)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [Database](#database)
  - [Development & Tooling](#development--tooling)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Clone the Repository](#clone-the-repository)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
  - [Seed the Database](#seed-the-database)
  - [Run the Project](#run-the-project)
  - [Running Tests](#running-tests)
- [Architecture Overview](#architecture-overview)
- [Real-Time Overview](#real-time-overview)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Scripts](#scripts)
- [Future Improvements / Roadmap](#future-improvements--roadmap)
- [AI-Assisted Development & Learning](#ai-assisted-development--learning)
- [License](#license)
- [Acknowledgements](#acknowledgements)
- [Additional Resources](#additional-resources)

---

## Overview

**KlasMwen** (from Haitian Creole “_klas mwen_”, meaning “_my class_”) provides a dedicated digital space for **middle and high school students** to:

- Ask questions and get help from peers
- Share study notes, tips, and learning resources
- Upload and access educational materials such as PDFs, Excel sheets, and eBooks

It empowers students to learn, share, and grow together in a community **built by students, for students**.

---

## Screenshots

![Landing Page](./docs/screenshots/desktop-landing-page.png)

![Feed Page](./docs/screenshots/feed.png)

![Profile Page](./docs/screenshots/profile.png)

![Notifications Page](./docs/screenshots/klasmwen-notifications.jpeg)

![Avatar Selection modal](./docs/screenshots/avatar-selection-dark.png)

![Report Dashboard](./docs/screenshots/report-dashboard.png)

---

## Key Features

KlasMwen includes a rich set of features designed to create a safe, collaborative, and student-friendly learning environment.

### Social & Learning Experience

- Create posts, ask questions, and share study notes
- Comment threads with nested replies
- Markdown support for clean, rich content
- Tag-based categorization and filtering
- Bookmarking and reactions (likes)
- Real-time notifications

### Resource Sharing

- Upload and download files (PDF, DOCX, XLSX, eBooks, images, etc.)
- Cloud storage via Cloudinary
- Automatic file metadata extraction

### Authentication & Access Control

- JWT-based authentication (http-only cookies)
- Role-Based Access Control (User, Moderator, Admin)
- Secure password handling and session validation
- Avatar selection from a predefined set (DiceBear)

### Safety & Moderation

- User reporting system (posts + comments)
- Moderation dashboard for viewing and managing reports
- Content flagging and review flow
- Rate limiting (Express Rate Limit) to stop spamming and abuse
- Validation on every request using Zod
- Structured logging and auditability using Pino

### Performance & Reliability

- Server-state caching with TanStack Query
- Optimistic UI updates
- Debounced search and API calls
- Efficient file uploads using Multer + Cloudinary
- Prisma ORM for reliable, type-safe database access

### Developer Experience

- Fully typed frontend + backend (TypeScript everywhere)
- Swagger/OpenAPI documentation for endpoints
- Vitest tests for frontend and backend
- Monorepo setup with shared tooling

---

## Live Demo

[https://klasmwen.netlify.app/](https://klasmwen.netlify.app/)

## Tech Stack

### Frontend

- **React 19** – UI library for building dynamic interfaces
- **Vite** – Modern build tool
- **TypeScript** – Type-safe JavaScript
- **TailwindCSS** – Utility-first styling
- **shadcn/ui** – Accessible, reusable UI components
- **TanStack Query (React Query)** – Server-state management and caching
- **React Hook Form** + **Zod** – Form handling and schema validation
- **Axios** – HTTP client
- **Zustand** – Global state management
- **Markdown Editor (MDEditor / Markdown Preview)** – Content creation
- **socket.io-client** – Real-time, bidirectional communication

### Backend

- **Node.js** + **Express 5** – RESTful API framework
- **Prisma ORM** – Type-safe database access
- **Passport.js (JWT & Local)** – Authentication and authorization
- **Multer** – File upload handling
- **Cloudinary** – Cloud-based media storage
- **Pino** – Structured logging
- **Swagger** – API documentation
- **Zod** – Request/response validation
- **Express Rate Limit** – Request throttling
- **socket.io** – Real-time, bidirectional communication

### Database

- **PostgreSQL** – Relational database managed via Prisma ORM

### Development & Tooling

- **Vitest** + **Testing Library** – Unit and integration testing
- **ESLint** + **Prettier** – Linting and formatting

---

## Getting Started

### Prerequisites

Ensure you have the following installed:

- Node.js ≥ 18.x.x
- npm or yarn (latest recommended)
- PostgreSQL ≥ 14.x
- Cloudinary account (for media uploads)
- Docker (optional)

> 💡 Tip: Use **nvm** to manage Node.js versions easily.

### Clone the Repository

```bash
git clone https://github.com/Pdave-dcn/KlasMwen
cd KlasMwen
```

### Environment Variables

#### Backend (`/backend/.env`)

```bash
cp backend/.env.example backend/.env
```

Example variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/klasmwen"
ALLOWED_ORIGIN="http://localhost:5173"
JWT_SECRET="your_jwt_secret"
NODE_ENV="development"
LOG_LEVEL="debug"

CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Admin credentials (defaults are used only in development)
ADMIN_USERNAME="admin_user"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="Admin123"
```

> **⚠️ Production Note:**
>
> When NODE_ENV=production, you must provide real admin values:
>
> - "**`ADMIN_USERNAME`**"
> - "**`ADMIN_EMAIL`**"
> - "**`ADMIN_PASSWORD`**"
>
> If any of these are missing, the server will fail to start.
> This ensures a secure admin account is created when seeding the database.

#### Frontend (`/frontend/.env`)

```bash
cp frontend/.env.example frontend/.env
```

Example:

```env
VITE_API_BASE_URL="http://localhost:3000/api"
VITE_SOCKET_URL="http://localhost:3000/"
```

### Installation

```bash
npm install
# or
yarn install
```

### Seed the Database

```bash
npm run db:seed
```

### Run the Project

#### Frontend Only

```bash
npm run start:frontend
```

#### Backend Only

```bash
npm run start:backend
```

#### Run Both

```bash
npm start
```

> Make sure `.env` files are properly configured.

### Running Tests

#### Frontend Tests

```bash
npm run test --workspace frontend
```

#### Backend Tests

```bash
npm run test --workspace backend
```

#### Interactive UI

```bash
npm run test:ui --workspace frontend
npm run test:ui --workspace backend
```

---

## Architecture Overview

KlasMwen is a monorepo with **frontend**, **backend**, and **PostgreSQL** database, integrated with **Cloudinary**.

### Main Components

1. **Frontend**: React + shadcn UI + TailwindCSS

   - UI, routing, forms, markdown editor, state management (Zustand)
   - API communication for CRUD, auth, and resources

2. **Backend API**: Node.js + Express + Prisma ORM

   - Business logic, REST endpoints, authentication, file uploads
   - Validates requests and interacts with database and Cloudinary

3. **Database**: PostgreSQL

   - Stores users, posts, notes, resources, and metadata

4. **External Services**: Cloudinary for media, Passport.js for authentication

### Data Flow

```bash
[User Browser / App]
        │
        ▼
[Frontend (React + shadcn)]
        │  API Calls
        ▼
[Backend (Node.js + Express + Prisma)]
   ┌─────┴─────┐
   ▼           ▼
[Database]   [Cloudinary]
```

- **Posting a Note/Resource**: Submit → Frontend → Backend validates → Upload to Cloudinary → Store in DB → Response → Frontend updates UI
- **Fetching Resources**: Frontend → Backend → Database → Frontend renders
- **Authentication**: Login → Frontend sends credentials → Backend validates → JWT issued → Frontend stores token

> Refer to [Architecture Docs](./docs/architecture.md) for more details.

Authentication state is verified on application startup using `/auth/me` before protected routes or socket connections are initialized.

---

## Real-Time Overview

KlasMwen uses Socket.IO for authenticated, user-scoped real-time features such as notifications. Socket connections are established only after session verification and are scoped to user-specific rooms. This architecture enables future features like group chats and live collaboration.

## API Documentation

- **Base URL**: `http://localhost:3000/api`
- **Swagger UI**: `http://localhost:3000/docs`
- **OpenAPI Spec**: `http://localhost:3000/swagger.json`

> Authentication: Protected endpoints require an `httpOnly` JWT cookie.

### Key Endpoints

| Module    | Core Functionality                        | Example Endpoints                                        |
| --------- | ----------------------------------------- | -------------------------------------------------------- |
| Auth      | Register, login, verify session, logout   | `POST /auth/register`, `GET /auth/me`                    |
| Posts     | CRUD for posts                            | `GET /posts`, `POST /posts`                              |
| Comments  | CRUD for comments, fetch parent & replies | `POST /comments/{postId}`, `GET /posts/{id}/comments`    |
| Users     | Get & update profiles                     | `GET /users/{id}`, `PUT /users/{id}`                     |
| Bookmarks | Bookmark/unbookmark posts                 | `GET /users/bookmarks`, `POST /bookmarks/{postId}`       |
| Reactions | Like/unlike posts                         | `POST /reactions/{postId}`                               |
| Tags      | Fetch tags, admin management              | `GET /tags/popular`, `POST /tags (Admin)`                |
| Avatars   | Retrieve & manage avatars                 | `GET /avatars/available`, `DELETE /avatars/{id} (Admin)` |
| Search    | Search posts                              | `GET /search/posts`                                      |
| Report    | Moderation operations                     | `GET /reports`, `GET /reports/reasons`                   |

---

## Troubleshooting

| Issue                   | Possible Cause                  | Solution                                       |
| ----------------------- | ------------------------------- | ---------------------------------------------- |
| `npm run dev` fails     | Missing `.env` variables        | Check `.env` in frontend & backend             |
| Database not seeding    | DB not running or unreachable   | Start PostgreSQL and run `npx prisma db seed`  |
| Frontend cannot connect | API base URL mismatch           | Verify `VITE_API_BASE_URL` matches backend     |
| File uploads fail       | Cloudinary keys missing/invalid | Check Cloudinary credentials in backend `.env` |
| Linting errors          | ESLint/Husky misconfigured      | Run `npm run lint:fix` or check `lint-staged`  |

---

## Scripts

| Script                   | Purpose                         |
| ------------------------ | ------------------------------- |
| `npm run start:frontend` | Start frontend dev server       |
| `npm run start:backend`  | Start backend dev server        |
| `npm start`              | Start both servers concurrently |
| `npm run test`           | Run tests (workspace-specific)  |
| `npm run test:ui`        | Run interactive test UI         |
| `npm run lint`           | Run linter                      |
| `npm run db:seed`        | Seed the database               |

---

## Future Improvements / Roadmap

KlasMwen is actively evolving, and several impactful features are planned to elevate collaboration, engagement, and accessibility.

### Upcoming Features

- **Group Chats & Study Circles**
  Create collaborative group spaces for classes, clubs, or focused study groups.

- **Analytics Dashboard**
  Insights for students, moderators, and admins, including:

  - Post and engagement metrics
  - Activity and learning trends
  - Moderation and report statistics

- **Multi-Language Support (i18n)**
  Full internationalization for a more accessible experience, starting with:

  - French
  - Haitian Creole

### Longer‑Term Ideas

- Quiz creation
- Scheduled study sessions
- AI-powered note summarization and question assistance
- Peer tutoring sessions via video or chat
- Integrations with platforms like Google Classroom or Moodle
- Mobile app (React Native / Expo)

---

## AI-Assisted Development & Learning

This project was developed with the assistance of AI tools as both a **productivity aid** and a **learning companion**.

As a junior developer, this was my largest and most complex project to date. AI played an important role in helping me **understand new concepts, evaluate design decisions, and improve code quality**, while all architectural choices and final implementations remained my responsibility.

### How AI was used

- Learning and understanding backend architecture patterns (e.g. thin controllers, service layers, CQRS-style separation)
- Exploring best practices for logging (Pino), error handling, and structured APIs
- Understanding and implementing OpenAPI / Swagger documentation
- Receiving suggestions for refactoring files and improving structure and readability
- Generating initial UI boilerplate (e.g. layouts, components, pages) that was then heavily refactored or rewritten
- Acting as a “rubber duck” to reason through edge cases and trade-offs

### Engineering decisions made by me

- Choosing which architectural patterns to adopt and applying them consistently
- Designing business logic, data models, and authorization rules
- Refactoring or discarding AI-generated code that did not meet project standards
- Enforcing type safety, validation, and error handling across frontend and backend
- Integrating real-time features (Socket.IO) into an existing authenticated system

### How correctness and quality were ensured

- End-to-end testing of core user flows
- Manual testing of authentication, permissions, and real-time notifications
- Schema validation on both client and server
- Iterative refactoring as understanding improved throughout the project

This project reflects **growth through iteration** — AI helped accelerate learning, but the architecture, decisions, and final system are the result of hands-on engineering and continuous refinement.

---

## License

This project is licensed under the terms in the [LICENSE](./LICENSE.md) file.

---

## Acknowledgements

Thanks to the communities behind **React, TailwindCSS, shadcn, Node.js, Express, Prisma, PostgreSQL, Cloudinary, Vitest, ESLint**, and other free and open-source tools.

---

## Additional Resources

- [Architecture Docs](./docs/architecture.md)
- [Backend Handbook](./docs/backend-developer-guide.md)
- [Frontend Handbook](./docs/frontend-developer-guide.md)
