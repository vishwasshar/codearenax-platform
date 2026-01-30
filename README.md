# CodeArenaX

Real-time collaborative coding platform designed for competitive coding, team collaboration, and hackathons.  
CodeArenaX combines conflict-free real-time editing, room-based communication, session persistence, and secure code execution into a single unified system.

---

## Overview

CodeArenaX is a real-time collaborative coding platform built for competitive programming, team collaboration, and hackathons. It provides a low-latency, multi-user coding environment with conflict-free real-time editing, room-based communication, session persistence, and extensible authentication.

The platform leverages CRDT-based synchronization (Yjs) to ensure strong consistency across concurrent editors, even under network latency or disconnections. A scalable backend powered by NestJS, Redis, and WebSockets enables real-time collaboration across multiple server instances, while MongoDB persists rooms, users, and code snapshots.

CodeArenaX is designed with scalability, reliability, and developer experience as first-class goals, making it suitable for building collaborative IDEs, interview platforms, and competitive coding systems.

---

## Screenshots

The following screenshots showcase the current state of CodeArenaX across key user flows.

### Login Page

![Login Page](./screenshots/Login.png)

### Rooms

![Rooms](./screenshots/Rooms.png)

### Create Room

![Create Room](./screenshots/CreateRoom.png)

### Update Room And Access Control

![Update Room](./screenshots/UpdateRoom.png)

### Resizable and Draggable Text Editor with Chat Widget

![Text Editor](./screenshots/TextEditor.png)

---

## Technology Stack

| Layer                  | Technology                                                                     |
| ---------------------- | ------------------------------------------------------------------------------ |
| Frontend               | React 19, TypeScript, Vite                                                     |
| Editor                 | Monaco Editor, @monaco-editor/react                                            |
| Realtime Communication | Socket.IO, Redis Adapter (Pub/Sub)                                             |
| Collaboration Engine   | Yjs (CRDT), y-monaco, y-protocols                                              |
| State Management       | Redux Toolkit, Redux Persist                                                   |
| UI & Styling           | Tailwind CSS, DaisyUI, Resizable Panels (re-resizable), Drag & Drop (@dnd-kit) |
| Backend                | NestJS (WebSockets, REST APIs)                                                 |
| Persistence            | MongoDB (Mongoose)                                                             |
| Caching & Sync         | Redis, ioredis                                                                 |
| Authentication         | JWT (Passport), Google OAuth (extensible)                                      |
| Developer Tools        | ESLint, Prettier, Jest, SWC                                                    |

---

## Project Phases

### Phase 1 – Core Real-Time Collaboration (Completed)

- JWT-based authentication
- Monaco Editor integration
- Room-based real-time code synchronization using WebSockets
- Basic in-room chat
- Backend APIs for room creation and joining

---

### Phase 2 – CRDT-Based Collaboration & Persistence (Completed) ✅

- Replaced naive WebSocket-based code synchronization with CRDT-based collaboration using Yjs
- Integrated Monaco Editor with Yjs using `y-monaco` for real-time collaborative editing
- Ensured conflict-free concurrent edits across multiple users and sessions
- Implemented room-based real-time updates using Socket.IO
- Added Redis Pub/Sub and Socket.IO Redis Adapter for multi-instance WebSocket scalability
- Implemented session persistence by storing CRDT snapshots and room data in MongoDB
- Added room lifecycle management (create, join, leave, cleanup)
- Implemented resizable and draggable UI panels for IDE-like flexible layouts
- Laid the foundation for extensible authentication using JWT and OAuth

---

### Phase 3 – Execution, Scaling, and Advanced Collaboration (In Progress)

- Docker-based isolated code execution engine
- Language-specific execution containers with resource limits
- Editor-to-execution pipeline for real-time code runs
- Execution result streaming back to the editor
- Improved session restore and recovery workflows
- Preparation for competitive coding and hackathon workflows

---

## How Real-Time Collaboration Works

- The editor state is represented as a CRDT document using Yjs
- All text operations are conflict-free and order-independent
- Monaco Editor is directly bound to the CRDT document
- Updates propagate via Socket.IO with Redis-backed pub/sub
- Sessions can be restored using stored snapshots

This design ensures consistency, low latency, and resilience to network interruptions.

---

## Environment Setup

CodeArenaX requires separate environment configuration for the frontend and backend services.  
All environment variables should be stored in `.env` files and **must not be committed** to version control.

---

## Frontend Environment (Vite)

Create a `.env` file in the frontend root directory.

### `.env`

```env
VITE_API_URL=http://localhost:5500
VITE_CRDT_SOCKET_URL=http://localhost:3003
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## Backend Environment (NestJS)

Create a `.env` file in the backend root directory.

### `.env`

```env
MONGOOSE_URI=mongodb_connection_string

JWT_SECRET=your_jwt_secret

CODE_EXECUTION_ENGINE_API=http://127.0.0.1:3000

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=postmessage

REDIS_URL=redis://username:password@host:port
REDIS_TTL=84400
```

---

## License

This project is licensed under the MIT License.  
See the [LICENSE](./LICENSE) file for details.
