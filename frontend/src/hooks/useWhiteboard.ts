import { useCallback, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import * as Y from "yjs";

export const useWhiteboard = (ydoc: Y.Doc | null, socket: Socket | null) => {
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const whiteboardMapRef = useRef<Y.Map<string> | null>(null);

  useEffect(() => {
    if (!ydoc) return;

    const wbMap = ydoc.getMap<string>("wb");
    whiteboardMapRef.current = wbMap;

    const existing = wbMap.get("store");
    if (existing) {
      setInitialSnapshot(existing);
    }

    setReady(true);

    return () => {
      setReady(false);
    };
  }, [ydoc]);

  useEffect(() => {
    if (!socket || !ready) return;

    const handleUpdate = (update: number[]) => {
      if (!ydoc) return;
      Y.applyUpdate(ydoc, new Uint8Array(update));
    };

    socket.on("crdt:wb-update", handleUpdate);
    return () => {
      socket.off("crdt:wb-update", handleUpdate);
    };
  }, [socket, ydoc, ready]);

  useEffect(() => {
    if (!socket || !ydoc) return;

    const handleLocalUpdate = (update: Uint8Array, origin: any) => {
      if (origin !== "whiteboard:tldraw") return;
      socket.emit("crdt:wb-edit", { update: Array.from(update) });
    };

    ydoc.on("update", handleLocalUpdate);
    return () => {
      ydoc.off("update", handleLocalUpdate);
    };
  }, [socket, ydoc]);

  const pushSnapshot = useCallback(
    (snapshot: string) => {
      if (!whiteboardMapRef.current) return;
      const wbMap = whiteboardMapRef.current;
      wbMap.doc?.transact(() => {
        wbMap.set("store", snapshot);
      }, "whiteboard:tldraw");
    },
    [],
  );

  return { initialSnapshot, ready, pushSnapshot };
};
