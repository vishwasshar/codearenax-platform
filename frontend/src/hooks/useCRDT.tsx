import { useCallback, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import * as Y from "yjs";

export const useCRDT = (socket: Socket, roomId: string) => {
  const ydocRef = useRef<Y.Doc | null>(null);

  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);

  const [language, setLanguage] = useState<string>("javascript");

  useEffect(() => {
    if (!socket) return;

    const handleCRDTDoc = (update: number[], lang: string) => {
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

    socket.on("crdt:doc", handleCRDTDoc);

    socket.on("crdt:code-update", handleRemoteUpdate);

    socket.on("crdt:lang-change", handleLangChangeRemote);

    return () => {
      socket.off("crdt:doc", handleCRDTDoc);
      socket.off("crdt:code-edit", handleRemoteUpdate);
      socket.off("crdt:lang-change", handleLangChangeRemote);
    };
  }, [socket]);

  useEffect(() => {
    const handleLocalUpdate = (update: Uint8Array) => {
      socket.emit("crdt:code-edit", { roomId, update: Array.from(update) });
    };

    ydoc?.on("update", handleLocalUpdate);

    return () => {
      ydoc?.off("update", handleLocalUpdate);
    };
  }, [ydoc]);

  const handleLangChange = useCallback(
    (lang: string) => {
      socket.emit("crdt:lang-change", { roomId, lang });
      setLanguage(lang);
    },
    [socket, roomId],
  );

  return { ydoc, language, handleLangChange };
};
