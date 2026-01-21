import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { io, Socket } from "socket.io-client";
import * as Y from "yjs";

export const useCRDTHook = (token: string, roomId: string) => {
  const socketRef = useRef<Socket | null>(null);

  const ydocRef = useRef<Y.Doc | null>(null);

  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);

  if (!socketRef.current) {
    socketRef.current = io(import.meta.env.VITE_CRDT_SOCKET_URL, {
      auth: { token },
      autoConnect: true,
    });
  }

  const socket = socketRef.current;

  const [language, setLanguage] = useState<string>("javascript");

  useEffect(() => {
    if (!roomId || !socket) return;

    const roomJoinHandler = (update: number[], lang: string) => {
      if (ydocRef.current) ydocRef.current?.destroy();
      ydocRef.current = new Y.Doc();

      setYdoc(ydocRef.current);

      Y.applyUpdate(ydocRef.current, new Uint8Array(update));
      setLanguage(lang);
    };

    const handleRemoteUpdate = (update: number[]) => {
      if (!ydocRef.current) return;
      Y.applyUpdate(ydocRef.current, new Uint8Array(update));
    };

    const handleLangChangeRemote = (updatedLang: string) => {
      setLanguage(updatedLang);
    };

    const handleError = (message: string) => {
      toast.error(message);
    };

    socket.on("room:joined", roomJoinHandler);

    socket.emit("room:join", roomId);

    socket.on("room:code-update", handleRemoteUpdate);

    socket.on("room:lang-change", handleLangChangeRemote);

    socket.on("room:error", handleError);

    return () => {
      socket.emit("room:leave", roomId);
      socket.off("room:joined", roomJoinHandler);
      socket.off("room:code-edit", handleRemoteUpdate);
      socket.off("room:lang-change", handleLangChangeRemote);
      socket.off("room:error", handleError);
    };
  }, [socket, roomId]);

  useEffect(() => {
    const handleLocalUpdate = (update: Uint8Array) => {
      socket.emit("room:code-edit", { roomId, update: Array.from(update) });
    };

    ydoc?.on("update", handleLocalUpdate);

    return () => {
      ydoc?.off("update", handleLocalUpdate);
    };
  }, [ydoc]);

  const handleLangChange = useCallback(
    (lang: string) => {
      socket.emit("room:lang-change", { roomId, lang });
      setLanguage(lang);
    },
    [socket, roomId],
  );

  return { ydoc, language, handleLangChange };
};
