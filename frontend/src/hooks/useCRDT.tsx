import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import * as Y from "yjs";
import { authRequest } from "../utils/axios.interceptor";
import { debounce } from "../utils/debounce";
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
} from "y-protocols/awareness";

const USER_COLORS = [
  { cursor: "#ff6b6b", selection: "#ff6b6b33" },
  { cursor: "#51cf66", selection: "#51cf6633" },
  { cursor: "#339af0", selection: "#339af033" },
  { cursor: "#f06595", selection: "#f0659533" },
  { cursor: "#cc5de8", selection: "#cc5de833" },
  { cursor: "#ff922b", selection: "#ff922b33" },
  { cursor: "#20c997", selection: "#20c99733" },
  { cursor: "#fcc419", selection: "#fcc41933" },
  { cursor: "#748ffc", selection: "#748ffc33" },
  { cursor: "#e599f7", selection: "#e599f733" },
];

export const useCRDT = (socket: Socket, userName: string) => {
  const ydocRef = useRef<Y.Doc | null>(null);
  const awarenessRef = useRef<Awareness | null>(null);

  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [awareness, setAwareness] = useState<Awareness | null>(null);

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
      if (awarenessRef.current) awarenessRef.current?.destroy();

      ydocRef.current = new Y.Doc();
      setYdoc(ydocRef.current);

      const awarenessInstance = new Awareness(ydocRef.current);
      awarenessRef.current = awarenessInstance;
      setAwareness(awarenessInstance);

      const colorIdx =
        ydocRef.current.clientID % USER_COLORS.length;
      const userColor = USER_COLORS[colorIdx];

      awarenessInstance.setLocalStateField("user", {
        name: userName,
        color: userColor.cursor,
      });

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

    const handleAwarenessUpdate = (update: number[]) => {
      if (!awarenessRef.current) return;
      applyAwarenessUpdate(
        awarenessRef.current,
        new Uint8Array(update),
        "remote",
      );
    };

    socket.on("crdt:doc", handleCRDTDoc);
    socket.on("crdt:code-update", handleRemoteUpdate);
    socket.on("crdt:lang-change", handleLangChangeRemote);
    socket.on("crdt:awareness-update", handleAwarenessUpdate);

    return () => {
      socket.off("crdt:doc", handleCRDTDoc);
      socket.off("crdt:code-update", handleRemoteUpdate);
      socket.off("crdt:lang-change", handleLangChangeRemote);
      socket.off("crdt:awareness-update", handleAwarenessUpdate);
    };
  }, [socket, userName]);

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

  useEffect(() => {
    if (!awareness || !socket) return;

    const handleAwarenessChange = (
      { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
      origin: string,
    ) => {
      if (origin === "remote") return;

      const changedClients = [...added, ...updated, ...removed];
      if (changedClients.length === 0) return;

      const encoded = encodeAwarenessUpdate(awareness, changedClients);
      socket.emit("crdt:awareness-update", {
        update: Array.from(encoded),
      });
    };

    awareness.on("change", handleAwarenessChange);

    return () => {
      awareness.off("change", handleAwarenessChange);
    };
  }, [awareness, socket]);

  const handleLangChange = useCallback(
    (lang: string) => {
      socket.emit("crdt:lang-change", { lang });
      setLanguage(lang);
    },
    [socket, roomMongooseId],
  );

  return {
    ydoc,
    awareness,
    language,
    handleLangChange,
    roomMongooseId,
    roomRole,
    handleCodeSave,
    saving,
  };
};
