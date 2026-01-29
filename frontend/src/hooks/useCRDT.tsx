import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import * as Y from "yjs";
import { authRequest } from "../utils/axios.interceptor";
import { debounce } from "../utils/debounce";

export const useCRDT = (socket: Socket) => {
  const ydocRef = useRef<Y.Doc | null>(null);

  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);

  const [language, setLanguage] = useState<string>("javascript");
  const [roomMongooseId, setRoomMongooseId] = useState<string | undefined>();
  const [roomRole, setRoomRole] = useState<string | undefined>();
  const [saving, setSaving] = useState<boolean>(false);

  const handleCodeSave = async () => {
    try {
      setSaving(true);
      await authRequest.put(`rooms/${roomMongooseId}/save`);
    } finally {
      setSaving(false);
    }
  };

  const debouncedSnapshotSave = useMemo(
    () => debounce(handleCodeSave, 30000),
    [roomMongooseId],
  );

  useEffect(() => {
    if (!socket) return;

    const handleCRDTDoc = (
      update: number[],
      lang: string,
      mongooseId: string,
      role: string,
    ) => {
      if (ydocRef.current) ydocRef.current?.destroy();
      ydocRef.current = new Y.Doc();

      setYdoc(ydocRef.current);

      Y.applyUpdate(ydocRef.current, new Uint8Array(update));
      setLanguage(lang);
      setRoomMongooseId(mongooseId);
      setRoomRole(role);
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
      socket.emit("crdt:code-edit", {
        update: Array.from(update),
      });

      debouncedSnapshotSave();
    };

    ydoc?.on("update", handleLocalUpdate);

    return () => {
      ydoc?.off("update", handleLocalUpdate);
    };
  }, [ydoc]);

  const handleLangChange = useCallback(
    (lang: string) => {
      socket.emit("crdt:lang-change", { lang });
      setLanguage(lang);
    },
    [socket, roomMongooseId],
  );

  return {
    ydoc,
    language,
    handleLangChange,
    roomMongooseId,
    roomRole,
    handleCodeSave,
    saving,
  };
};
