# API Reference — Postman Testing

**Base URL:** `http://localhost:3000`  
**API prefix:** `/api`

---

## 1. Health (no auth)

| Method | URL | Auth | Body | Notes |
|--------|-----|------|------|------|
| GET | `http://localhost:3000/api/health` | None | — | Returns `{ status, timestamp }` |

**Postman:** New request → GET → `http://localhost:3000/api/health` → Send.

---

## 2. Auth (no auth)

### Register

| Method | URL | Auth | Body |
|--------|-----|------|------|
| POST | `http://localhost:3000/api/auth/register` | None | JSON below |

**Headers:** `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Your Name"
}
```

**Required:** `email`, `password` (min 6 chars), `name`.

**Success (201):** `{ "token": "eyJ...", "user": { "id", "email", "name" } }`  
**Errors:** 400 (validation / email exists), 500.

---

### Login

| Method | URL | Auth | Body |
|--------|-----|------|------|
| POST | `http://localhost:3000/api/auth/login` | None | JSON below |

**Headers:** `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success (200):** `{ "token": "eyJ...", "user": { "id", "email", "name" } }`  
**Errors:** 400 (missing fields), 401 (wrong credentials), 500.

**Copy the `token`** from the response and use it for all task APIs below.

---

## 3. Tasks (Bearer token required)

Use the token from login/register in every request.

**Postman:** Auth tab → Type: **Bearer Token** → paste token.  
**Headers:** Set **Content-Type** to **application/json** for POST and PATCH (Body → raw → JSON).

---

### 3.1 List tasks

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `http://localhost:3000/api/tasks` |
| **Postman location** | Method: GET, URL: `http://localhost:3000/api/tasks`. Params tab: optional `status`, `title`. No Body. |
| **Auth** | Bearer Token (paste token) |

**Query params (optional):**

| Param | Type | Example | Effect |
|-------|------|--------|--------|
| `status` | string | `todo`, `in-progress`, `done` | Return only tasks with this status |
| `title` | string | `bug` | Return only tasks whose title contains this (case-insensitive) |

**Examples:**  
`GET /api/tasks` — all your tasks  
`GET /api/tasks?status=done` — only done tasks  
`GET /api/tasks?title=review` — tasks with "review" in the title  
`GET /api/tasks?status=todo&title=fix` — todo tasks with "fix" in the title  

**Body params:** None.

**Success (200):** Array of tasks:
```json
[
  {
    "id": "674a1b2c3d4e5f678901234",
    "title": "Fix login bug",
    "description": "User cannot login on mobile",
    "status": "in-progress",
    "createdBy": { "id": "674a...", "name": "John" },
    "assignedTo": { "id": "674a...", "name": "Jane" }
  }
]
```
**Errors:** 401 (no/invalid token), 500.

---

### 3.2 Create task

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `http://localhost:3000/api/tasks` |
| **Postman location** | Method: POST, URL: `http://localhost:3000/api/tasks`, Body → raw → JSON. |
| **Auth** | Bearer Token |

**Body params:**

| Key | Type | Required | Allowed values / notes |
|-----|------|----------|------------------------|
| `title` | string | Yes | Non-empty string |
| `description` | string | No | Default `""` |
| `status` | string | No | `"todo"` \| `"in-progress"` \| `"done"`. Default `"todo"` |
| `assignedTo` | string | No | User `_id` (MongoDB ObjectId). Omit or leave empty to leave unassigned |

**Example body (raw JSON) — minimal:**
```json
{
  "title": "Review pull request"
}
```

**Example body — full:**
```json
{
  "title": "Review pull request",
  "description": "Check auth flow and tests",
  "status": "todo",
  "assignedTo": "674a1b2c3d4e5f678901234"
}
```

**Success (201):** Single task object (same shape as in list).  
**Errors:** 400 (missing/invalid title), 401, 500.

---

### 3.3 Update task

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `http://localhost:3000/api/tasks/:id` |
| **Postman location** | Method: PATCH, URL: `http://localhost:3000/api/tasks/674a1b2c3d4e5f678901234` (replace `674a...` with real task `id` from GET /api/tasks), Body → raw → JSON. |
| **Auth** | Bearer Token |

**Rule:** Only the **creator** of the task can update. Others get **403**.

**Body params (all optional; send only what you want to change):**

| Key | Type | Required | Notes |
|-----|------|----------|--------|
| `title` | string | No | New title (non-empty to apply) |
| `description` | string | No | New description |
| `status` | string | No | `"todo"` \| `"in-progress"` \| `"done"` |
| `assignedTo` | string \| null | No | User `_id` to assign; `""` or omit to clear assignee |

**Example body — change status only:**
```json
{
  "status": "in-progress"
}
```

**Example body — change multiple:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "done",
  "assignedTo": "674a1b2c3d4e5f678901234"
}
```

**Example body — clear assignee:**
```json
{
  "assignedTo": ""
}
```

**Success (200):** Updated task object.  
**Errors:** 400 (invalid id), 401, 403 (not creator), 404 (task not found), 500.

---

### 3.4 Delete task

| | |
|---|---|
| **Method** | `DELETE` |
| **URL** | `http://localhost:3000/api/tasks/:id` |
| **Postman location** | Method: DELETE, URL: `http://localhost:3000/api/tasks/674a1b2c3d4e5f678901234` (replace with real task `id`). No Body. |
| **Auth** | Bearer Token |

**Rule:** Only the **creator** of the task can delete. Others get **403**.

**Body params:** None.

**Success (204):** No response body.  
**Errors:** 400 (invalid id), 401, 403 (not creator), 404 (task not found), 500.

---

## Quick Postman setup

1. **Environment variable (optional):**  
   Create an env with `baseUrl` = `http://localhost:3000` and `token` = (paste after login).  
   Use `{{baseUrl}}/api/...` and Auth → Bearer Token → `{{token}}`.

2. **Order to test:**  
   Register → Login (copy token) → GET /api/tasks → POST /api/tasks (create) → PATCH /api/tasks/:id → DELETE /api/tasks/:id.

3. **Task status values:** Only `todo`, `in-progress`, `done`.
