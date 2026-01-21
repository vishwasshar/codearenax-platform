# ⚔️ CodeArenaX

> **Real-time Multiplayer Coding Battles. Powered by CRDT, Redis, and Socket.IO.**

Collaborate, compete, and code with your team in real time. CodeArenaX is an advanced multiplayer code editor that supports **live sync**, **room-based communication**, **session persistence**, and **conflict-free collaboration** using **CRDTs**.

---

## 🚀 Tech Stack

| Layer        | Tech Used                                      |
|--------------|-------------------------------------------------|
| Frontend     | React, Monaco Editor, Tailwind CSS              |
| Realtime     | Socket.IO, Redis (Pub/Sub), Yjs (CRDT), y-websocket |
| Backend      | NestJS                                          |
| Persistence  | MongoDB (Rooms, Messages, Snapshots)           |
| Logs (optional) | Redis Streams / Firebase (Collaboration Logs) |

---

## 📌 Features

### ✅ Phase 1 (Complete)

- 🔐 JWT-based authentication with Google OAuth
- 🧠 Code editor with Socket.IO-based real-time sync
- 🏠 Room creation and joining (via backend API)
- 🌐 Socket.IO rooms and basic chat events

---

### 🔥 Phase 2 (In Progress)

| Feature | Description |
|--------|-------------|
| 🧬 **CRDT (Yjs) Sync** | - Replace naive code sync with Yjs<br>- Integrate `y-websocket`, `y-monaco`<br>- Conflict-free editing with multiple clients<br>- Store CRDT snapshots in memory or MongoDB |
| 💬 **In-room Chat System** | - Add chat panel in the UI<br>- Broadcast messages using Socket.IO<br>- Save messages in MongoDB<br>- Load last 50 messages on room join |
| 🏗️ **Room Lifecycle Enhancements** | - API to create/list/delete rooms<br>- Support custom-named rooms (e.g., `/room/devteam-vishwas`)<br>- Auto-delete empty rooms<br>- Persist room metadata |
| 💾 **Session Persistence** | - Save editor snapshot periodically or on manual trigger<br>- UI toggle to restore previous session<br>- Store metadata & user joins |
| 📡 **Redis Pub/Sub Integration** | - Use `socket.io-redis` adapter<br>- Enable multi-instance support<br>- Pub/Sub for Yjs sync and chat |
| 📊 **Collaboration Logs** | - Track user actions `{roomId, userId, action, timestamp}`<br>- Use MongoDB, Redis Streams, or Firebase<br>- Optional admin dashboard for monitoring |

---

## 🔄 How CRDT + Yjs Works

- **Yjs** is a CRDT (Conflict-free Replicated Data Type) that allows **realtime editing** without merge conflicts.
- Clients connect via **y-websocket**.
- **Monaco Editor** is bound to the Yjs document for live syncing.
- Snapshots can be stored for recovery and session restore.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
