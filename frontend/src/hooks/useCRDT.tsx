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

export type FileEntry = {
  path: string;
  lang: string;
};

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
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [activeFile, setActiveFile] = useState<string>("");
  const activeFileRef = useRef(activeFile);
  activeFileRef.current = activeFile;

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
      filesList: FileEntry[],
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

      if (filesList?.length) {
        setFiles(filesList);
        const firstFile = filesList[0].path;
        setActiveFile(firstFile);
        setLanguage(filesList[0].lang || "javascript");
      }

      setRoomMongooseId(mongooseId);
      setRoomRole(role);
    };

    const handleRemoteUpdate = (update: number[]) => {
      if (!ydocRef.current) return;
      Y.applyUpdate(ydocRef.current, new Uint8Array(update));
    };

    const handleLangChangeRemote = (data: { lang: string; filePath?: string }) => {
      if (data.filePath && data.filePath === activeFile) {
        setLanguage(data.lang);
      } else if (!data.filePath) {
        setLanguage(data.lang);
      }
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
  }, [socket, userName, activeFile]);

  useEffect(() => {
    if (!ydoc) return;
    const filesArr = ydoc.getArray<{ path: string; lang: string }>("files");

    const current = filesArr.toArray();
    setFiles(current);
    if (!activeFile && current.length > 0) {
      setActiveFile(current[0].path);
      setLanguage(current[0].lang || "javascript");
    }

    const observer = () => {
      const updated = filesArr.toArray();
      setFiles(updated);
      if (!activeFileRef.current && updated.length > 0) {
        setActiveFile(updated[0].path);
        setLanguage(updated[0].lang || "javascript");
      }
    };

    filesArr.observe(observer);
    return () => filesArr.unobserve(observer);
  }, [ydoc]);

  useEffect(() => {
    const handleLocalUpdate = (update: Uint8Array) => {
      socket.emit("crdt:code-edit", {
        update: Array.from(update),
        filePath: activeFileRef.current,
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
      socket.emit("crdt:lang-change", { lang, filePath: activeFile });
      setLanguage(lang);
    },
    [socket, activeFile],
  );

  const createFile = useCallback((path: string, lang: string = "javascript") => {
    const doc = ydocRef.current;
    if (!doc) return false;

    const filesArr = doc.getArray<{ path: string; lang: string }>("files");
    const exists = filesArr.toArray().some((f) => f.path === path);
    if (exists) return false;

    doc.transact(() => {
      filesArr.push([{ path, lang }]);
      doc.getText(path).insert(0, "");
    });

    setActiveFile(path);
    setLanguage(lang);
    return true;
  }, []);

  const deleteFile = useCallback((path: string) => {
    const doc = ydocRef.current;
    if (!doc) return false;

    const filesArr = doc.getArray<{ path: string; lang: string }>("files");
    const files = filesArr.toArray();
    if (files.length <= 1) return false;

    const idx = files.findIndex((f) => f.path === path);
    if (idx === -1) return false;

    doc.transact(() => {
      filesArr.delete(idx, 1);
    });

    if (activeFile === path) {
      const remaining = filesArr.toArray();
      if (remaining.length > 0) {
        setActiveFile(remaining[0].path);
        setLanguage(remaining[0].lang);
      }
    }
    return true;
  }, [activeFile]);

  const renameFile = useCallback((oldPath: string, newPath: string) => {
    const doc = ydocRef.current;
    if (!doc) return false;

    const filesArr = doc.getArray<{ path: string; lang: string }>("files");
    const files = filesArr.toArray();

    const idx = files.findIndex((f) => f.path === oldPath);
    if (idx === -1) return false;
    if (files.some((f) => f.path === newPath)) return false;

    const content = doc.getText(oldPath).toString();
    const lang = files[idx].lang;

    doc.transact(() => {
      filesArr.delete(idx, 1);
      filesArr.insert(idx, [{ path: newPath, lang }]);
      doc.getText(newPath).insert(0, content);
    });

    if (activeFile === oldPath) {
      setActiveFile(newPath);
    }
    return true;
  }, [activeFile]);

  const switchFile = useCallback((path: string) => {
    const doc = ydocRef.current;
    if (!doc) return;

    const filesArr = doc.getArray<{ path: string; lang: string }>("files");
    const file = filesArr.toArray().find((f) => f.path === path);
    if (!file) return;

    setActiveFile(path);
    setLanguage(file.lang);
  }, []);

  return {
    ydoc,
    awareness,
    files,
    activeFile,
    createFile,
    deleteFile,
    renameFile,
    switchFile,
    language,
    handleLangChange,
    roomMongooseId,
    roomRole,
    handleCodeSave,
    saving,
  };
};
