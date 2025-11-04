# KlasMwen — Educational Social App

**KlasMwen** is an educational social platform designed to connect students, promote knowledge sharing, and support their growth together as a community.

---

## Overview

**KlasMwen** (from Haitian Creole “_klas mwen_”, meaning “_my class_”) is an educational social platform designed to connect students, foster knowledge sharing, and encourage collective growth.

The platform creates a dedicated digital space for **middle and high school students** to:

- Ask questions and get help from peers
- Share study notes, tips, and learning resources
- Upload and access educational materials such as PDFs, Excel sheets, and eBooks

KlasMwen aims to make education more accessible especially for students with limited access to resources by empowering them to learn, share, and grow together in a community built **by students, for students**.

---

## Tech Stack

### 1. Frontend

- **React 19** – UI library for building dynamic interfaces
- **Vite** – Fast and modern build tool for React
- **TypeScript** – Type-safe JavaScript for better scalability
- **TailwindCSS** – Utility-first CSS framework for modern styling
- **shadcn/ui** – Component library built on **Radix UI** and **TailwindCSS** for accessible, reusable UI components
- **TanStack Query (React Query)** – Efficient server-state management and caching
- **React Hook Form** + **Zod** – Form handling and schema validation
- **Axios** – Promise-based HTTP client
- **Zustand** – Lightweight global state management
- **Markdown Editor (MDEditor / Markdown Preview)** – For content creation and formatting

### 2. Backend

- **Node.js** + **Express 5** – RESTful API framework
- **Prisma ORM** – Type-safe database client and schema modeling
- **Passport.js (JWT & Local)** – Authentication and authorization
- **Multer** – File upload handling
- **Cloudinary** – Cloud-based file storage and delivery
- **Pino** – Structured logging
- **Swagger** – API documentation
- **Zod** – Request/response validation
- **Express Rate Limit** – Request throttling for security

### 3. Database

- **PostgreSQL** – Relational database managed via Prisma ORM

### 4. Development & Tooling

- **Vitest** + **Testing Library** – Unit and integration testing
- **ESLint** + **Prettier** – Code linting and formatting

---

## Getting Started

### 1. Prerequisites

Before you begin, ensure you have the following installed on your system:

- Node.js ≥ 18.x.x
- npm or yarn (latest recommended)
- PostgreSQL ≥ 14.x (running locally or remotely)
- Cloudinary account (for media storage, if uploading files)
- Docker (optional, for containerized setup)

> 💡 Tip: Use tools like nvm to manage Node.js versions easily.

### 2. Clone the Repository

```bash
git clone https://github.com/Pdave-dcn/KlasMwen
cd KlasMwen
```

### 3. Environment Variables

You’ll need to configure environment variables for both the **backend** and **frontend** before running the project.

#### Backend (`/backend/.env`)

Create a `.env` file in the backend directory (you can start from `.env.example` if provided):

```bash
cp backend/.env.example backend/.env
```

Then, fill in the following variables:

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

> 💡 **Note:**
>
> - `DATABASE_URL` should point to your PostgreSQL instance.
> - `ALLOWED_ORIGIN` must match your frontend’s base URL.
> - Cloudinary keys are only required if you plan to upload or serve media files.

#### Frontend (`/frontend/.env`)

In the frontend directory, create your `.env` file:

```bash
cp frontend/.env.example frontend/.env
```

Then, add your API base URL:

```env
VITE_API_BASE_URL="http://localhost:3000/api"
```

> ⚙️ Adjust this value to match your backend’s host and port.

### 4. Installation

Install dependencies:

```bash
npm install
# or
yarn install
```

### 5. Run the Project

KlasMwen uses a monorepo structure with separate frontend and backend workspaces. You can run them individually or together.

#### 1. Run Frontend Only

```bash
npm run start:frontend
```

Starts the frontend development server (REACT + Vite) at `http://localhost:5173` by default.

#### 2. Run Backend Only

```bash
npm run start:backend
```

Starts the backend development server (Node.js + Express) at `http://localhost:3000` by default.

#### 3. Run Both Frontend and Backend Together

```bash
npm start
```

This command uses `concurrently` to run **both servers at the same time**. You should see logs for both the frontend and backend in your terminal.

> 💡 Tip: Make sure your `.env` files are properly configured for both frontend and backend before starting the servers.

### 6. Running Tests

KlasMwen uses **Vitest** for unit and integration testing. You can run tests for the frontend, backend, or both.

#### 1. Run Frontend Tests

```bash
npm run test --workspace frontend
```

Run the frontend test suite using Vitest.

#### 2. Run Backend Tests

```bash
npm run test --workspace backend
```

Run the backend test suite using Vitest.

#### 3. Run All Tests (Optional)

You can run both frontend and backend tests in parallel using a monorepo-aware script or run them separately as above.

#### 4. UI Test Runner (Optional)

```bash
npm run test:ui --workspace frontend
npm run test:ui --workspace backend
```

Launches Vitest's interactive UI for exploring and running tests in a browser.

> 💡 Tip: Make sure your development servers are not running on the same ports when running tests that depend on the API.

---

## Architecture Overview

KlasMwen is structured as a monorepo with distinct **frontend** and **backend** workspaces, a **PostgreSQL database**, and integration with external services such as **Cloudinary** for media storage. The architecture is designed to support collaborative learning, resource sharing, and a responsive user experience.

### Main Components

1. **Frontend**: React + shadcn UI + TailwindCSS

   - Handles the user interface, routing, forms, markdown editor, and state management (Zustand)
   - Communicates with the backend API for CRUD operations, authentication, and resource fetching

2. **Backend API**: Node.js + Express + Prisma ORM

   - Implements business logic, REST endpoints, authentication (Passport.js with JWT), and file uploads
   - Validates incoming requests and interacts with the database and Cloudinary

3. **Database**: PostgreSQL

   - Stores users, posts, notes, shared resources, and metadata
   - Accessed via Prisma ORM for type-safe queries

4. **External Services**:

   - **Cloudinary**: Hosts media files (PDFs, images, Excel sheets) uploaded by students
   - **Authentication**: Managed by Passport.js JWT strategy

### Data Flow

```bash
[User Browser / App]
        │
        ▼
[Frontend (React + shadcn)]
        │  API Calls (HTTP/HTTPS)
        ▼
[Backend (Node.js + Express + Prisma)]
   ┌─────┴─────┐
   ▼           ▼
[Database]   [Cloudinary]
```

- **Posting a Note or Resource**: User submits → Frontend sends POST request → Backend validates → Uploads media to Cloudinary if applicable → Stores in Database → Returns success → Frontend updates UI
- **Fetching Resources**: Frontend requests data → Backend queries Database → Returns list → Frontend renders content
- **Authentication Flow**: User logs in → Frontend sends credentials → Backend validates and issues JWT → Frontend stores token for subsequent requests

This architecture ensures modularity, scalability, and ease of maintenance, while providing students with a reliable and interactive educational platform.

> For detailed architecture, refer to [Architecture Docs](./docs/architecture.md).

---

## API Documentation

KlasMwen exposes a powerful, organized **RESTful API** documented using **OpenAPI/Swagger**.

While the Swagger UI in this setup is **read-only** (you cannot execute requests from the interface), it provides detailed specifications for all available endpoints, request parameters, schemas, and response formats.

---

### API Base URL

```bash
http://localhost:3000/api
```

### Swagger UI

You can view the full API documentation at:

```bash
http://localhost:3000/docs
```

### OpenAPI Spec

A machine-readable OpenAPI spec is also available:

```bash
http://localhost:3000/swagger.json
```

### 🌐 API Access

| Detail                              | URL                                  |
| :---------------------------------- | :----------------------------------- |
| **API Base URL**                    | `http://localhost:3000/api`          |
| **Swagger UI** (Documentation)      | `http://localhost:3000/docs`         |
| **OpenAPI Spec** (Machine-readable) | `http://localhost:3000/swagger.json` |

> ⚠️ **Authentication Note:** For protected endpoints, authentication is handled via an **`httpOnly` cookie** containing a JWT. Ensure your client correctly handles and sends this cookie for endpoints requiring authorization.

---

### 🔑 Core API Functionality (Tags & Key Endpoints)

The API is structured into the following modules, covering all major functionalities:

| Module        | Core Functionality                                                                        | Key Endpoint Examples                                   |
| :------------ | :---------------------------------------------------------------------------------------- | :------------------------------------------------------ |
| **Auth**      | User **registration**, **login**, session verification (`/me`), and **logout**.           | `POST /auth/register` `GET /auth/me`                    |
| **Posts**     | **CRUD** (Create, Read, Update, Delete) operations for posts.                             | `GET /posts` `POST /posts`                              |
| **Comments**  | **CRUD** for comments, including fetching **parent comments** for a post and **replies**. | `POST /comments/{postId}` `GET /posts/{id}/comments`    |
| **Users**     | Retrieve and **update user profiles**.                                                    | `GET /users/{id}` `PUT /users/{id}`                     |
| **Bookmarks** | Allow authenticated users to **bookmark** and **unbookmark** posts.                       | `GET /users/bookmarks` `POST /bookmarks/{postId}`       |
| **Reactions** | **Like** and **unlike** posts.                                                            | `POST /reactions/{postId}`                              |
| **Tags**      | Retrieve all tags, popular tags. **Admin** endpoints for tag management.                  | `GET /tags/popular` `POST /tags` (Admin)                |
| **Avatars**   | Retrieve available avatars, and **Admin** endpoints to **add** or **delete** avatars.     | `GET /avatars/available` `DELETE /avatars/{id}` (Admin) |
| **Search**    | **Search posts** by various criteria (term, type, tags).                                  | `GET /search/posts`                                     |

---

## Troubleshooting

List of common problems and suggested solutions when setting up or running KlasMwen:

| Issue                              | Possible Cause                            | Solution                                                                          |
| ---------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------- |
| `npm run dev` fails                | Missing or misconfigured `.env` variables | Verify `.env` files in both `frontend` and `backend`, update values as needed     |
| Database not seeding               | Database not running or unreachable       | Ensure PostgreSQL is running locally or via Docker; then run `npx prisma db seed` |
| Frontend cannot connect to backend | Incorrect API base URL                    | Check `VITE_API_BASE_URL` in frontend `.env` matches backend URL                  |
| File uploads fail                  | Cloudinary keys missing or invalid        | Verify Cloudinary credentials in backend `.env`                                   |
| Linting errors prevent commits     | ESLint/Husky misconfigured                | Run `npm run lint:fix` or check `lint-staged` configuration                       |

---

## 🧾 License

This project is licensed under the terms in the [LICENSE](./LICENSE.md) file.

---

## 🙌 Acknowledgements

KlasMwen was built entirely using **free and open-source technologies**, and we are deeply grateful to the communities that maintain and develop these tools.

Special thanks to libraries, frameworks, and services that made this project possible:

- **Frontend & UI:** React, Next.js, TailwindCSS, shadcn
- **Backend & APIs:** Node.js, Express, Prisma
- **Database & Storage:** PostgreSQL, Cloudinary (free plan)
- **Testing & Tooling:** Vitest, ESLint, Husky, Lint-Staged

> This project demonstrates how a fully functional educational platform can be built using entirely free and open-source tools.

---

## 📚 Additional Resources

- [Architecture Docs](./docs/architecture.md)
- [Setup Guide](./docs/setup.md)

---
