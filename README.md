# CodeArenaX

Real-time collaborative coding platform designed for competitive coding, team collaboration, and hackathons.  
CodeArenaX combines conflict-free real-time editing, room-based communication, session persistence, and secure code execution into a single unified system.

---

## Overview

CodeArenaX is built to solve the limitations of traditional remote coding tools by providing a low-latency, multi-user coding environment with strong consistency guarantees. It enables multiple developers to collaborate on the same codebase in real time, communicate within rooms, restore previous sessions, and execute code securely in isolated environments.

The system is designed with scalability, fault tolerance, and extensibility in mind.

---

## Technology Stack

| Layer | Technology |
|------|-----------|
| Frontend | React, TypeScript, Monaco Editor |
| Realtime Communication | Socket.IO, Redis (Pub/Sub) |
| Collaboration Engine | Yjs (CRDT), y-monaco |
| Backend | NestJS |
| Persistence | MongoDB (Rooms, Messages, Snapshots) |
| Code Execution | Docker-based sandboxed execution |
| Authentication | JWT (OAuth extensible) |

---

## Project Phases

### Phase 1 – Core Real-Time Collaboration (Completed)

- JWT-based authentication
- Monaco Editor integration
- Room-based real-time code synchronization using WebSockets
- Basic in-room chat
- Backend APIs for room creation and joining

---

### Phase 2 – CRDT-Based Collaboration & Persistence (Completed)

- Replaced naive WebSocket code sync with CRDT-based synchronization using Yjs
- Integrated Monaco Editor with Yjs via `y-monaco`
- Verified conflict-free editing across multiple concurrent clients
- Implemented in-room chat with message persistence
- Added room lifecycle management (create, list, delete, auto-cleanup)
- Implemented session persistence with snapshot storage in MongoDB
- Integrated Redis Pub/Sub for multi-instance WebSocket scalability

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

## License

This project is licensed under the MIT License.  
See the [LICENSE](./LICENSE) file for details.