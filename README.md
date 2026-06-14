# CodeArenaX

CodeArenaX is a real-time collaborative coding platform for competitive programming, technical interviews, team collaboration, and hackathons. It combines conflict-free code editing, room-based communication, persistent sessions, authentication, and an extensible execution pipeline in one full-stack application.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Phases](#project-phases)
- [License](#license)

---

## Overview

CodeArenaX provides a low-latency, multi-user coding environment with collaborative editing, chat, call widgets, room access control, session persistence, and secure backend APIs.

The platform uses CRDT-based synchronization with Yjs so concurrent editor changes remain conflict-free, order-independent, and resilient to latency or reconnection. A NestJS backend handles REST APIs and WebSocket gateways, Redis enables scalable Socket.IO pub/sub across server instances, and MongoDB persists users, rooms, and code snapshots.

CodeArenaX is designed as a foundation for collaborative IDEs, coding interview tools, competitive programming rooms, and hackathon workspaces.

---

## Features

- JWT authentication with extensible Google OAuth support
- Room creation, update, join, leave, and access-control workflows
- Monaco-powered code editor with real-time CRDT collaboration
- Conflict-free editing through Yjs, `y-monaco`, and Socket.IO
- Redis-backed WebSocket scaling for multi-instance deployments
- MongoDB persistence for users, rooms, and collaborative session snapshots
- In-room chat and call widgets for team communication
- Resizable and draggable IDE-style UI panels
- Backend code-run API integration point for an external execution engine
- TypeScript-first frontend and backend development experience

---

## Screenshots

The following screenshots showcase the current state of CodeArenaX across key user flows.

### Login Page

![Login Page](./screenshots/Login.png)

### Rooms

![Rooms](./screenshots/Rooms.png)

### Create Room

![Create Room](./screenshots/CreateRoom.png)

### Update Room and Access Control

![Update Room](./screenshots/UpdateRoom.png)

### Resizable and Draggable Text Editor with Chat Widget

![Text Editor](./screenshots/TextEditor.png)

---

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Editor | Monaco Editor, `@monaco-editor/react` |
| Realtime Communication | Socket.IO, Redis Adapter (Pub/Sub) |
| Collaboration Engine | Yjs (CRDT), `y-monaco`, `y-protocols` |
| State Management | Redux Toolkit, Redux Persist |
| UI & Styling | Tailwind CSS, DaisyUI, `re-resizable`, `@dnd-kit` |
| Backend | NestJS, REST APIs, WebSocket gateways |
| Persistence | MongoDB, Mongoose |
| Caching & Sync | Redis, ioredis |
| Authentication | JWT, Passport, Google OAuth support |
| Media/Terminal UX | mediasoup client, xterm.js |
| Developer Tools | ESLint, Prettier, Jest, SWC |

---

## Architecture

```text
Browser / React Client
  ├─ REST API calls ───────────────▶ NestJS HTTP API
  ├─ Room sockets ─────────────────▶ NestJS Socket.IO gateways
  ├─ CRDT editor updates ──────────▶ Yjs + Socket.IO collaboration layer
  └─ Code execution requests ──────▶ NestJS run-code module ─▶ External execution engine

NestJS Backend
  ├─ MongoDB stores users, rooms, and snapshots
  ├─ Redis powers Socket.IO pub/sub and cross-instance sync
  └─ JWT/Passport protects authenticated routes
```

### How Real-Time Collaboration Works

- Each editor session is represented as a Yjs CRDT document.
- Monaco Editor is bound directly to the shared CRDT document with `y-monaco`.
- Text updates are conflict-free and can be merged safely from multiple users.
- Socket.IO transports collaboration events between clients and backend gateways.
- Redis pub/sub allows real-time events to scale across multiple backend instances.
- MongoDB snapshots make room/session restoration possible after reconnects or restarts.

---

## Project Structure

```text
.
├── backend/          # NestJS API, WebSocket gateways, auth, rooms, users, run-code integration
├── frontend/         # React + Vite client, collaborative editor, rooms UI, chat/call widgets
├── screenshots/      # README screenshots
├── LICENSE
└── README.md
```

---

## Prerequisites

Install the following before running the project locally:

- Node.js 20 or newer
- npm
- MongoDB instance
- Redis instance
- Optional: a running code execution engine compatible with `CODE_EXECUTION_ENGINE_API`
- Optional: Google OAuth credentials for Google sign-in

---

## Environment Setup

CodeArenaX requires separate environment configuration for the frontend and backend services. Store these values in local `.env` files and do not commit secrets to version control.

### Frontend Environment

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5500
VITE_CRDT_SOCKET_URL=http://localhost:3003
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Backend Environment

Create `backend/.env`:

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

## Getting Started

Run the backend and frontend in separate terminals.

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Start the backend

```bash
npm run start:dev
```

### 3. Install frontend dependencies

```bash
cd frontend
npm install
```

### 4. Start the frontend

```bash
npm run dev
```

The frontend will be served by Vite, and the backend will expose the NestJS API and WebSocket endpoints according to its local configuration.

---

## Available Scripts

### Backend

Run from `backend/`:

| Command | Description |
| --- | --- |
| `npm run start:dev` | Start NestJS in watch mode |
| `npm run build` | Build the backend |
| `npm run start:prod` | Run the compiled backend from `dist/` |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:cov` | Run tests with coverage |

### Frontend

Run from `frontend/`:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build the production frontend |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## Project Phases

### Phase 1 – Core Real-Time Collaboration (Completed)

- JWT-based authentication
- Monaco Editor integration
- Room-based real-time code synchronization using WebSockets
- Basic in-room chat
- Backend APIs for room creation and joining

### Phase 2 – CRDT-Based Collaboration and Persistence (Completed)

- Replaced naive WebSocket code synchronization with CRDT-based collaboration using Yjs
- Integrated Monaco Editor with Yjs using `y-monaco`
- Ensured conflict-free concurrent edits across multiple users and sessions
- Implemented room-based real-time updates using Socket.IO
- Added Redis Pub/Sub and Socket.IO Redis Adapter for multi-instance WebSocket scalability
- Implemented session persistence by storing CRDT snapshots and room data in MongoDB
- Added room lifecycle management for create, join, leave, and cleanup flows
- Implemented resizable and draggable UI panels for IDE-like layouts
- Laid the foundation for extensible authentication using JWT and OAuth

### Phase 3 – Execution, Scaling, and Advanced Collaboration (In Progress)

- Docker-based isolated code execution engine
- Language-specific execution containers with resource limits
- Editor-to-execution pipeline for real-time code runs
- Execution result streaming back to the editor
- Improved session restore and recovery workflows
- Competitive coding and hackathon workflow enhancements

---

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
