## Fullstack Server — Documentation

This repository contains a **Node.js + Express + TypeScript** API server for a full‑stack application.  
It exposes authentication and task‑management endpoints backed by **MongoDB** and secured with **JWT**.

---

### 1. Tech Stack

- **Runtime**: Node.js (LTS recommended)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Atlas or self‑hosted)
- **Auth**: JSON Web Tokens (JWT)
- **ORM/ODM**: Mongoose

---

### 2. Getting Started (Local Development)

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Create a `.env` file in the root of the project, based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and set:

   - `PORT` — port for the API (defaults to `3000` if omitted).
   - `JWT_SECRET` — a strong random secret for signing tokens.
   - `MONGODB_URI` — your MongoDB connection string (e.g. MongoDB Atlas).

3. **Run the server in dev mode (with hot‑reload)**

   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:3000` by default.

4. **Build and run in production mode**

   ```bash
   npm run build
   npm start
   ```

   - `npm run build` compiles TypeScript into `dist/`.
   - `npm start` runs `node dist/server.js`.

---

### 3. API Overview

- **Base URL (local)**: `http://localhost:3000`
- **Base URL (production)**: `https://collabortaor-server.onrender.com`
- **API prefix**: `/api`

High‑level endpoints (see `API-POSTMAN.md` for full details):

- **Health**: `GET /api/health`
- **Auth**
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- **Tasks** (JWT Bearer token required)
  - `GET /api/tasks`
  - `POST /api/tasks`
  - `PATCH /api/tasks/:id`
  - `DELETE /api/tasks/:id`

For step‑by‑step Postman usage and sample request/response bodies, open `API-POSTMAN.md`.

---

### 4. Project Structure

```text
server.ts          # App entry point
config/db.ts       # MongoDB connection
routes/            # Route definitions (index, auth, tasks, users, health)
controllers/       # Route handlers / business logic
models/            # Mongoose models (User, Task, ...)
middleware/        # Auth & request‑related middleware (e.g., JWT verification)
types/             # Custom TypeScript type declarations
API-POSTMAN.md     # Detailed API usage with Postman examples
tsconfig.json      # TypeScript configuration
package.json       # Scripts and dependencies
```

---

### 5. Running With a Frontend

The server enables CORS and by default allows a client at:

- `http://localhost:3001` (configurable via `CLIENT_ORIGIN` env var)

If you are running a frontend:

- Start the frontend on `http://localhost:3001` (or configure your own origin).
- Set `CLIENT_ORIGIN` in `.env` to match your frontend base URL.

---

### 6. Common Tasks

- **Check server health**

  Open in browser or via curl:

  ```bash
  curl http://localhost:3000/api/health
  ```

- **Basic smoke test**

  After starting the server, hit:

  ```bash
  curl http://localhost:3000/
  ```

  You should see a JSON response like:

  ```json
  { "status": "ok", "message": "Server is running" }
  ```

---

### 7. Notes & Best Practices

- Never commit your real `.env` file or production credentials.
- Use a **unique JWT secret** in each environment.
- Ensure your MongoDB user has the minimum privileges required.
- When deploying, set all environment variables in your hosting provider (e.g. Render, Railway, etc.).

