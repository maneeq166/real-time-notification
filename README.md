# Notification Service — Short Version

## Purpose

Persistent notification backend: store notifications, fetch them, and enable later real-time delivery.

## Tech

Node.js, TypeScript, Express, Prisma, PostgreSQL. (WebSockets + Redis added later.)

---

## Core Prisma models (minimal)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  notifications Notification[]
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      String
  payload   Json
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}
```

---

## Key API endpoints (core)

- `POST /users` — create user
  Body: `{ email, name }`
- `POST /notifications` — create notification
  Body: `{ userId, type, payload }`
- `GET /notifications/:userId` — list newest first
- `PATCH /notifications/:id/read` — mark read

Payload pattern:

```json
{
  "type": "USER_FOLLOWED",
  "payload": { "actorId": "u1", "actorName": "Aneeq" }
}
```

(Backend sends data; frontend composes text.)

---

## Minimal flow (one-liner)

Event → create notification row (DB) → attempt real-time emit (if online) → otherwise client fetches later.

---

## Short folder layout

```
project-1-notification-system/
│
├── src/
│   ├── app.ts                  # Express app bootstrap
│   ├── server.ts               # HTTP + Socket server start
│   │
│   ├── config/
│   │   ├── env.ts              # env validation
│   │   ├── redis.ts            # redis client & pub/sub
│   │   ├── prisma.ts           # prisma client
│   │   └── socket.ts           # socket.io setup
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.middleware.ts
│   │   │
│   │   ├── events/
│   │   │   ├── event.controller.ts
│   │   │   ├── event.service.ts
│   │   │   ├── event.publisher.ts   # publishes to Redis
│   │   │   └── event.types.ts
│   │   │
│   │   ├── notifications/
│   │   │   ├── notification.controller.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── notification.routes.ts
│   │   │   └── notification.types.ts
│   │   │
│   │   └── users/
│   │       ├── user.service.ts
│   │       └── user.types.ts
│   │
│   ├── socket/
│   │   ├── socket.handler.ts    # connection, join rooms
│   │   └── socket.events.ts     # emit helpers
│   │
│   ├── workers/
│   │   └── notification.sub.ts  # Redis subscriber
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   │
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── logger.ts
│   │   └── constants.ts
│   │
│   ├── routes.ts               # route aggregation
│   └── index.ts                # entry point
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── tests/
│   ├── auth.test.ts
│   ├── notification.test.ts
│   └── event.test.ts
│
├── .env.example
├── jest.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Build / delivery order (first sprint)

1. Prisma schema + `npx prisma migrate dev --name init`
2. `POST /users` (create users)
3. `POST /notifications`, `GET /notifications/:userId`, `PATCH /:id/read`
4. Basic validation + error handling + tests
5. Add Socket.IO (user rooms)
6. Add Redis Pub/Sub (scale)

---

## API Endpoints — What they do & how to implement (no code)

This is **conceptual + implementation guidance only**.

---

## 1. User APIs

### 1.1 Create user

`POST /users`

**Purpose**
Create a system user who can receive notifications.

**Input**

```json
{
  "email": "user@test.com",
  "name": "User"
}
```

**Backend logic**

1. Validate email
2. Check if user already exists
3. Insert into `User` table
4. Return created user

**Used when**

- Signup
- First-time onboarding

---

## 2. Notification APIs

### 2.1 Create notification

`POST /notifications`

**Purpose**
Store a notification when an event happens.

**Input**

```json
{
  "userId": "target-user-id",
  "type": "USER_FOLLOWED",
  "payload": {
    "actorName": "Aneeq"
  }
}
```

**Backend logic**

1. Validate `userId` and `type`
2. Do NOT generate UI text
3. Save notification in DB
4. (Later) emit real-time event

**Used when**

- Follow
- Like
- Comment
- Mention

---

### 2.2 Get user notifications

`GET /notifications/:userId`

**Purpose**
Fetch all notifications for a user.

**Backend logic**

1. Validate user exists
2. Query notifications by `userId`
3. Sort by `createdAt DESC`
4. Return list

**Used when**

- App opens
- Notifications screen loads
- Page refresh

---

### 2.3 Get unread count

`GET /notifications/:userId/unread-count`

**Purpose**
Show notification badge count.

**Backend logic**

1. Filter notifications where `read = false`
2. Count rows
3. Return number

**Used when**

- Navbar badge
- Mobile app icon count

---

### 2.4 Mark notification as read

`PATCH /notifications/:id/read`

**Purpose**
Mark a single notification as seen.

**Backend logic**

1. Validate notification exists
2. Update `read = true`
3. Return updated record

**Used when**

- User clicks notification

---

### 2.5 Mark all as read

`PATCH /notifications/read-all`

**Purpose**
Clear all unread notifications.

**Input**

```json
{
  "userId": "user-id"
}
```

**Backend logic**

1. Update all notifications for user
2. Set `read = true`
3. Return success

**Used when**

- “Mark all as read” button

---

## 3. Event APIs (internal)

### 3.1 Emit event

`POST /events`

**Purpose**
Central entry point for all actions.

**Input**

```json
{
  "event": "USER_FOLLOWED",
  "actorId": "user-a",
  "targetUserId": "user-b"
}
```

**Backend logic**

1. Validate event type
2. Map event → notification type
3. Build payload
4. Create notification
5. (Later) publish to Redis

**Used when**

- You want clean architecture
- Decouple business logic

---

## 4. Notification types (enum idea)

These are **constants**, not routes.

```
USER_FOLLOWED
POST_LIKED
POST_COMMENTED
MENTIONED
SYSTEM_ALERT
```

Each maps to a payload shape.

---

## 5. Payload rules (very important)

Backend sends **data only**.

Frontend decides text.

Example:

```json
{
  "type": "POST_LIKED",
  "payload": {
    "actorName": "Ali",
    "postId": "123"
  }
}
```

Frontend:

> Ali liked your post

---

## 6. Notification delivery phases

### Phase 1 — Database only (MVP)

- Create notification
- Fetch via REST

### Phase 2 — Real-time

- Socket.IO
- Emit on create

### Phase 3 — Scalable

- Redis Pub/Sub
- Workers

---

## 7. Order to implement

1. User creation
2. Notification create
3. Notification fetch
4. Mark read
5. Unread count
6. Event abstraction
7. Real-time

---

## 8. How this is used in real apps

- Instagram → same pattern
- GitHub → same pattern
- LinkedIn → same pattern

**DB-first notifications always win.**

If you want next:

- Notification payload design per event
- Socket.IO flow
- Redis pub/sub flow

Below is a **clean, beginner-friendly, endpoint-by-endpoint build overview**.
No code. Only **what files touch it, what logic goes where, and how to think**.

---

# How to Build Each API Endpoint (Conceptual Guide)

Think in **3 layers always**:

1. **Route** → defines URL + HTTP method
2. **Controller** → handles request/response
3. **Service** → business logic + DB (Prisma)

---

## 0. Common setup (applies to all endpoints)

Before any endpoint:

- Express app initialized
- JSON body parsing enabled
- Prisma client ready
- Error middleware added

Every endpoint follows:

```
Request → Route → Controller → Service → Prisma → Response
```

---

## 1. `POST /users` — Create User

### Purpose

Create a user who can receive notifications.

### Files involved

- `users.routes.ts`
- `users.controller.ts`
- `users.service.ts`

### How to build it

**Route**

- Accepts POST `/users`
- Forwards request to controller

**Controller**

- Extract `email`, `name` from body
- Validate required fields
- Call user service
- Return JSON response

**Service**

- Check if user already exists (by email)
- If exists → throw error
- Else → create user in DB
- Return created user

**Key idea**

- User creation is **idempotent by email**
- Email is your natural unique key

---

## 2. `POST /notifications` — Create Notification

### Purpose

Store a notification caused by an event.

### Files involved

- `notifications.routes.ts`
- `notifications.controller.ts`
- `notifications.service.ts`

### How to build it

**Route**

- Accepts POST `/notifications`

**Controller**

- Extract `userId`, `type`, `payload`
- Validate:
  - userId exists
  - type is allowed

- Call notification service
- Return created notification

**Service**

- Ensure target user exists
- Insert notification row:
  - userId
  - type
  - payload
  - read = false

- (Later) emit socket / publish event

**Key idea**

- Backend **never generates UI text**
- Payload is raw data only

---

## 3. `GET /notifications/:userId` — Fetch Notifications

### Purpose

Show notifications screen.

### Files involved

- `notifications.routes.ts`
- `notifications.controller.ts`
- `notifications.service.ts`

### How to build it

**Route**

- Accepts GET `/notifications/:userId`

**Controller**

- Extract `userId` from params
- Call service
- Return array

**Service**

- Validate user exists
- Query notifications by `userId`
- Order by `createdAt DESC`
- Return list

**Key idea**

- DB is source of truth
- Frontend can refetch anytime

---

## 4. `GET /notifications/:userId/unread-count`

### Purpose

Badge count (red dot).

### Files involved

- Same notifications files

### How to build it

**Controller**

- Extract `userId`
- Call service
- Return `{ count: number }`

**Service**

- Count notifications:
  - userId
  - read = false

**Key idea**

- Count query only (cheap, fast)

---

## 5. `PATCH /notifications/:id/read` — Mark One Read

### Purpose

Mark a notification as seen.

### Files involved

- `notifications.routes.ts`
- `notifications.controller.ts`
- `notifications.service.ts`

### How to build it

**Controller**

- Extract `notificationId`
- Call service
- Return updated notification

**Service**

- Ensure notification exists
- Update `read = true`
- Return updated row

**Key idea**

- Single row mutation
- Idempotent (calling twice is fine)

---

## 6. `PATCH /notifications/read-all`

### Purpose

Clear all notifications.

### Files involved

- Same notifications files

### How to build it

**Controller**

- Extract `userId` (body or auth)
- Call service
- Return success

**Service**

- Update all notifications:
  - userId
  - read = false → true

**Key idea**

- Bulk update
- No need to return rows

---

## 7. `POST /events` — Event Abstraction (Optional but powerful)

### Purpose

Decouple business actions from notifications.

### Files involved

- `events.routes.ts`
- `events.controller.ts`
- `events.service.ts`

### How to build it

**Controller**

- Receive `{ event, actorId, targetUserId }`
- Validate event type
- Call service

**Service**

- Map event → notification type
- Build payload
- Call notification service internally
- (Later) publish to Redis

**Key idea**

- App talks in **events**
- Notification system reacts

---

## 8. Notification Types (Constants)

These live in:

- `notification.types.ts`
- `constants.ts`

Examples:

```
USER_FOLLOWED
POST_LIKED
POST_COMMENTED
MENTIONED
```

Each type has:

- Expected payload shape
- Frontend rendering logic

---

## 9. Mental Model (very important)

```
Action happens
↓
Event emitted
↓
Notification created (DB)
↓
If user online → push
Else → fetch later
```

**Never rely only on sockets.
DB-first always.**

---

## 10. Build Order (Recommended)

1. Prisma schema + migrate
2. User creation
3. Notification creation
4. Fetch notifications
5. Mark read
6. Unread count
7. Event abstraction
8. Socket.IO
9. Redis Pub/Sub

---

If you want next, say one of these:

- “Explain notification payloads per event”
- “Explain Socket.IO flow”
- “Explain Redis pub/sub flow”
- “Give me request/response examples only”

Below are **tiny, copy-while-typing TypeScript snippets**.
Not full files. Only **core patterns** so your brain + fingers learn TS.

---

## 0. TypeScript mindset (important first)

In TS backend you always type:

- `req.body`
- `req.params`
- function return types (sometimes)

You do **NOT** type everything on day 1.

---

## 1. Express app (smallest working)

```ts
import express from "express";

const app = express();
app.use(express.json());

app.listen(3000, () => {
  console.log("Server running");
});
```

Focus:

- `import`
- arrow functions
- no semicolons obsession

---

## 2. Prisma client (minimal)

```ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```

That’s it.
Don’t overthink adapters yet.

---

## 3. POST `/users` (create user)

### Route idea

```ts
app.post("/users", async (req, res) => {
  // logic here
});
```

### Controller logic (typed lightly)

```ts
const { email, name } = req.body;

if (!email) {
  return res.status(400).json({ error: "email required" });
}
```

### Prisma call

```ts
const user = await prisma.user.create({
  data: {
    email,
    name,
  },
});
```

### Response

```ts
res.status(201).json(user);
```

---

## 4. POST `/notifications`

### Extract body

```ts
const { userId, type, payload } = req.body;
```

### Validate

```ts
if (!userId || !type) {
  return res.status(400).json({ error: "invalid data" });
}
```

### Create notification

```ts
const notification = await prisma.notification.create({
  data: {
    userId,
    type,
    payload: payload ?? {},
  },
});
```

---

## 5. GET `/notifications/:userId`

### Params typing (simple)

```ts
const { userId } = req.params;
```

### Query

```ts
const notifications = await prisma.notification.findMany({
  where: { userId },
  orderBy: { createdAt: "desc" },
});
```

### Return

```ts
res.json(notifications);
```

---

## 6. PATCH `/notifications/:id/read`

### Param

```ts
const { id } = req.params;
```

### Update

```ts
const updated = await prisma.notification.update({
  where: { id },
  data: { read: true },
});
```

---

## 7. Unread count (important query)

```ts
const count = await prisma.notification.count({
  where: {
    userId,
    read: false,
  },
});
```

Return:

```ts
res.json({ count });
```

---

## 8. Event abstraction (simple version)

```ts
const { event, actorId, targetUserId } = req.body;
```

Map event → notification:

```ts
if (event === "USER_FOLLOWED") {
  await prisma.notification.create({
    data: {
      userId: targetUserId,
      type: "USER_FOLLOWED",
      payload: { actorId },
    },
  });
}
```

---

## 9. Common TS errors you WILL see (normal)

### ❌ Property does not exist

Fix:

```ts
req.body as any;
```

or later define an interface.

### ❌ Possibly undefined

Fix:

```ts
process.env.DATABASE_URL!;
```

### ❌ Async error not caught

Fix:
Wrap in `try/catch` later. Ignore for now.

---

## 10. What to type first (exact order)

1. Express app
2. Prisma client
3. `POST /users`
4. `POST /notifications`
5. `GET /notifications/:userId`
6. `PATCH /read`

That alone = **real backend project**.

---

If you want next, say:

- `next: payload typing`
- `next: error handling`
- `next: folder structure`
- `next: socket.io minimal`

Below are **minimal, production-style WebSocket (Socket.IO) code snippets** for a notification system.

Not full files.
Only the **core patterns** you will actually write.

This is enough to implement it yourself without dependency.

---

# 1. Install

```bash
npm install socket.io
```

(If client later: `socket.io-client`)

---

# 2. Attach Socket.IO to server

```ts
// src/server.ts
import { createServer } from "http";
import { Server } from "socket.io";
import { app } from "./app.js";

const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: { origin: "*" },
});

httpServer.listen(3000);
```

---

# 3. Socket bootstrap

```ts
// src/socket/socket.ts
import { io } from "../server.js";

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});
```

Import once in server startup.

---

# 4. Authenticate socket (JWT)

```ts
// src/socket/socket.ts
import jwt from "jsonwebtoken";

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    socket.data.user = decoded;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});
```

Client sends:

```ts
io("http://localhost:3000", {
  auth: { token: "JWT_HERE" },
});
```

---

# 5. Join user room

Each user gets **their own room**.

```ts
io.on("connection", (socket) => {
  const userId = socket.data.user.id;

  socket.join(userId);

  console.log("User joined room:", userId);
});
```

Now you can emit to a specific user.

---

# 6. Emit notification after DB save

```ts
// src/modules/notifications/notification.service.ts
import { io } from "../../server.js";

export async function createNotification(data) {
  const notification = await prisma.notification.create({ data });

  io.to(data.userId).emit("notification:new", notification);

  return notification;
}
```

This is the **entire real-time logic.**

DB first.
Socket second.

---

# 7. Client receive example

```ts
socket.on("notification:new", (notification) => {
  console.log("New notification:", notification);
});
```

---

# 8. Mark online users (optional)

```ts
const onlineUsers = new Map<string, string>();

io.on("connection", (socket) => {
  onlineUsers.set(socket.data.user.id, socket.id);

  socket.on("disconnect", () => {
    onlineUsers.delete(socket.data.user.id);
  });
});
```

Used only for presence.

---

# 9. Important mental model

REST API:

Used for:

- initial load
- history
- reliability

WebSockets:

Used for:

- instant delivery
- UI updates

Golden rule:

DB write ALWAYS happens even if socket fails.

---

# 10. Typical flow in your project

```text
User A follows User B
        ↓
POST /events/follow
        ↓
create notification (DB)
        ↓
emit socket event
        ↓
if online → instant UI update
if offline → user fetches later
```

---

# 11. What you should implement first

1. Socket server attach
2. JWT socket auth
3. Join user room
4. Emit on notification create
5. Client log listener

Stop.

Then scale.

---

# 12. Event names you will use

```
notification:new
notification:read
notification:clear
```

---

# 13. Minimal folder placement

```
src/
  server.ts
  socket/socket.ts
  modules/notifications/notification.service.ts
```

---

If you want next, I can give you:

• Redis pub/sub socket scaling snippet
• mobile push extension design
• notification batching logic
• typing for socket events
• production pitfalls (memory, auth, scaling)
