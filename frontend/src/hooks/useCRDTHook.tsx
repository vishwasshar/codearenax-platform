import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import * as Y from "yjs";

export const useCRDTHook = (token: string, roomId: string) => {
  const ydoc = new Y.Doc();
  const socket = io(import.meta.env.VITE_CRDT_SOCKET_URL, {
    auth: { token },
  });

  const navigate = useNavigate();

  const [language, setLanguage] = useState<string>("javascript");

  socket.emit("room:join", roomId);

  socket.on("room:lang-change", (updatedLang) => {
    setLanguage(updatedLang);
  });

  socket.on("room:code-edit", (update) => {
    Y.applyUpdate(ydoc, new Uint8Array(update));
  });

  socket.on("room:error", (message) => {
    navigate("/create-room");
    toast.error(message);
  });

  ydoc.on("update", (update) => {
    socket.emit("room:edit", { roomId, update: Array.from(update) });
  });

  const handleLangChange = useCallback(
    (lang: string) => {
      socket.emit("room:lang-change", { roomId, lang });
    },
    [socket],
  );

  return { ydoc, language, handleLangChange };
};
