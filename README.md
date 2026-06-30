# CodeArenaX

CodeArenaX is a real-time collaborative coding platform for competitive programming, technical interviews, team collaboration, and hackathons. It combines CRDT-based conflict-free code editing, voice/video calls, room-based access control, session replay, interactive code graphs, a shared whiteboard, and an extensible execution pipeline in one full-stack application.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
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

CodeArenaX provides a low-latency, multi-user coding environment with collaborative editing, in-room chat, media (voice/video) calls via mediasoup, a shared whiteboard, a code graph visualizer, a file tree with multi-tab editing, a built-in terminal, and session replay. Room access is controlled through owner/editor/viewer roles, and sessions are persisted to MongoDB with Redis-backed WebSocket scaling.

The platform uses CRDT-based synchronization with Yjs so concurrent editor changes remain conflict-free, order-independent, and resilient to latency or reconnection. A NestJS backend handles REST APIs and WebSocket gateways, Redis enables scalable Socket.IO pub/sub across server instances, and MongoDB persists users, rooms, and code snapshots.

---

## Features

- **CRDT Collaboration** — Conflict-free concurrent editing via Yjs, `y-monaco`, and Socket.IO.
- **Monaco Editor** — Full-featured code editor with syntax highlighting, multi-cursor, and IntelliSense.
- **File Management** — In-editor file tree with create, rename, delete, and multi-tab support.
- **Language Switching** — Per-file language selection (JavaScript, TypeScript, Python, Java, Go, Rust, C++, and more).
- **Code Execution** — Run code against a backend execution engine with real-time output in the terminal panel.
- **Interactive Call Graph** — Visualize function calls, dependencies, and cycles; supports sequence diagrams.
- **Shared Whiteboard** — Real-time collaborative whiteboard powered by tldraw and Yjs.
- **Collaboration Sidebar** — See who's online, in-room chat, and media controls.
- **Voice/Video Calls** — Peer-to-peer media via mediasoup with dynamic transport management.
- **Session Replay** — Replay code edits and cursor movements for any room session.
- **Access Control** — Owner, editor, and viewer roles per room with user management.
- **Authentication** — JWT-based with Google OAuth support.
- **Persistent Sessions** — MongoDB snapshots enable room restoration across restarts.
- **Resizable UI** — IDE-style panels that can be resized, collapsed, and rearranged.
- **Responsive Design** — Dark-themed UI with Tailwind CSS and DaisyUI.

---

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Editor | Monaco Editor, `@monaco-editor/react` |
| Collaboration Engine | Yjs (CRDT), `y-monaco`, `y-protocols`, `y-indexeddb` |
| Real-time Communication | Socket.IO, Redis Adapter (Pub/Sub) |
| State Management | Redux Toolkit, Redux Persist |
| UI & Styling | Tailwind CSS, DaisyUI, `re-resizable`, `@dnd-kit` |
| Backend | NestJS, REST APIs, WebSocket gateways |
| Persistence | MongoDB, Mongoose |
| Caching & Sync | Redis, ioredis |
| Authentication | JWT, Passport, Google OAuth |
| Media | mediasoup (WebRTC SFU) |
| Whiteboard | tldraw, Yjs binding |
| Terminal | xterm.js |
| Graph Visualization | React Flow, Elkjs, Mermaid |
| Developer Tools | ESLint, Prettier, Jest, SWC |

---

## Architecture

```text
Browser / React Client
  ├─ REST API calls ───────────────▶ NestJS HTTP API
  ├─ Room sockets ─────────────────▶ NestJS Socket.IO gateways
  ├─ CRDT editor updates ──────────▶ Yjs + Socket.IO collaboration layer
  ├─ Code execution requests ──────▶ NestJS run-code module ─▶ External execution engine
  ├─ Whiteboard sync ──────────────▶ Yjs + tldraw over Socket.IO
  └─ Voice/video calls ────────────▶ mediasoup (SFU) over Socket.IO

NestJS Backend
  ├─ MongoDB stores users, rooms, code snapshots, and chat history
  ├─ Redis powers Socket.IO pub/sub, cross-instance sync, and room metadata
  ├─ JWT/Passport protects authenticated routes and socket connections
  └─ mediasoup worker manages WebRTC transports, producers, and consumers
```

### How Real-Time Collaboration Works

- Each editor session is represented as a Yjs CRDT document.
- Monaco Editor is bound directly to the shared CRDT document with `y-monaco`.
- Text updates are conflict-free and can be merged safely from multiple users.
- Socket.IO transports collaboration events between clients and backend gateways.
- Redis pub/sub allows real-time events to scale across multiple backend instances.
- MongoDB snapshots make room and session restoration possible after reconnects or restarts.
- The whiteboard uses tldraw over a separate Yjs document bound via Socket.IO.
- Call graphs are computed client-side by parsing function declarations and calls from the CRDT document text.

---

## Project Structure

```text
.
├── backend/          # NestJS API, WebSocket gateways, auth, rooms, users, run-code, replay, mediasoup
│   ├── src/
│   │   ├── auth/           # JWT & Google OAuth strategies, guards
│   │   ├── rooms/          # Room CRUD, gateway, guard, service
│   │   ├── crdt/           # CRDT update forwarding, language sync
│   │   ├── chat/           # In-room chat messages
│   │   ├── mediasoup/      # WebRTC SFU transport management
│   │   ├── replay/         # Edit history and session replay
│   │   ├── run-code/       # Code execution integration
│   │   ├── schemas/        # Mongoose schemas (room, user, chat, replay)
│   │   └── redis-store/    # Redis persistence helpers
│   └── ...
├── frontend/         # React + Vite client
│   ├── src/
│   │   ├── components/     # CollabSidebar, FileTree, TabBar, StatusBar, TerminalPanel, WhiteboardCanvas, GraphPanel, etc.
│   │   ├── pages/          # Login, Register, Rooms, CreateRoom, TextEditor, RoomReplay
│   │   ├── hooks/          # useCRDT, useRoomSocket, useCodeGraph, etc.
│   │   ├── redux/          # Redux store, user slice
│   │   └── commons/        # Shared types, language list
│   └── ...
├── screenshots/      # README screenshots
├── LICENSE
└── README.md
```

---

## Prerequisites

- Node.js 20 or newer
- npm
- MongoDB instance
- Redis instance
- Optional: a running code execution engine compatible with `CODE_EXECUTION_ENGINE_API`
- Optional: Google OAuth credentials for Google sign-in

---

## Environment Setup

Create separate `.env` files for frontend and backend. Do not commit secrets.

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5500
VITE_CRDT_SOCKET_URL=http://localhost:3003
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Backend (`backend/.env`)

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

Run backend and frontend in separate terminals.

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Start the backend

```bash
npm run start:dev
```

### 3. Install and start the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be served by Vite (default `http://localhost:5173`), and the backend will expose the NestJS API on the configured port.

---

## Available Scripts

### Backend (from `backend/`)

| Command | Description |
| --- | --- |
| `npm run start:dev` | Start NestJS in watch mode |
| `npm run build` | Build the backend |
| `npm run start:prod` | Run the compiled backend from `dist/` |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:cov` | Run tests with coverage |

### Frontend (from `frontend/`)

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build the production frontend |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## Project Phases

### Phase 1 – Core Real-Time Collaboration (Completed)

- JWT-based authentication with Google OAuth support
- Monaco Editor integration with language switching
- Room-based real-time code synchronization using WebSockets
- In-room chat and basic API for rooms and users

### Phase 2 – CRDT Collaboration, Persistence, and Advanced UI (Completed)

- Replaced naive WebSocket sync with CRDT-based collaboration using Yjs
- Integrated Monaco Editor with Yjs via `y-monaco` for conflict-free editing
- Added Redis Pub/Sub and Socket.IO Redis Adapter for multi-instance scaling
- MongoDB snapshot persistence for room restoration across restarts
- Room lifecycle management (create, join, leave, cleanup)
- Resizable and draggable IDE-style panels with File Tree, Tab Bar, and Status Bar
- Collab Sidebar with online users, chat, and media controls
- Voice/video calls via mediasoup SFU
- Shared whiteboard with tldraw and Yjs binding
- Interactive code graph (call graph, dependency graph, sequence diagram)
- Built-in terminal panel with xterm.js
- Session replay with cursor and edit history
- Room access control (owner, editor, viewer)

### Phase 3 – Execution, Scaling, and Workflow Enhancements (In Progress)

- Docker-based isolated code execution engine
- Language-specific execution containers with resource limits
- Editor-to-execution pipeline for real-time code runs
- Execution result streaming back to the terminal
- Improved session restore and recovery workflows
- Competitive coding and hackathon workflow enhancements

---

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
