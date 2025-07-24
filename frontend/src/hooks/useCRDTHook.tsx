import { io } from "socket.io-client";
import * as Y from "yjs";

export const useCRDTHook = (roomId: string) => {
  const ydoc = new Y.Doc();
  const socket = io(import.meta.env.VITE_CRDT_SOCKET_URL);

  socket.emit("room:join", roomId);

  socket.on("room:edit", (update) => {
    Y.applyUpdate(ydoc, new Uint8Array(update));
  });

  ydoc.on("update", (update) => {
    socket.emit("room:edit", { roomId, update: Array.from(update) });
  });

  return ydoc;
};
