# KlasMwen — Educational Social App

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-✓-blue)

**KlasMwen** is an educational social platform designed to connect students, promote knowledge sharing, and support collective growth.

---

## Overview

**KlasMwen** (from Haitian Creole “_klas mwen_”, meaning “_my class_”) provides a dedicated digital space for **middle and high school students** to:

- Ask questions and get help from peers
- Share study notes, tips, and learning resources
- Upload and access educational materials such as PDFs, Excel sheets, and eBooks

It empowers students to learn, share, and grow together in a community **built by students, for students**.

---

## Screenshots

![Landing Page](./docs/screenshots/desktop-landingpage.png)

![Feed Page](./docs/screenshots/feed.png)

![Profile Page](./docs/screenshots/profile.png)

![Avatar Selection modal](./docs/screenshots/avatar-selection-dark.png)

![Tablet Version](./docs/screenshots/tablet-feed-dark.png)

![Mobile version](./docs/screenshots/mobile-search-dark.png)

## Live Demo

> Coming Soon ⏰

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
```

#### Frontend (`/frontend/.env`)

```bash
cp frontend/.env.example frontend/.env
```

Example:

```env
VITE_API_BASE_URL="http://localhost:3000/api"
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

---

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

## License

This project is licensed under the terms in the [LICENSE](./LICENSE.md) file.

---

## Acknowledgements

Thanks to the communities behind **React, Next.js, TailwindCSS, shadcn, Node.js, Express, Prisma, PostgreSQL, Cloudinary, Vitest, ESLint**, and other free and open-source tools.

---

## Additional Resources

- [Architecture Docs](./docs/architecture.md)
- [Backend Handbook](./docs/backend-developer-guide.md)
- [Frontend Handbook](./docs/frontend-developer-guide.md)
