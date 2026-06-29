import { useCallback, useEffect, useMemo, useRef } from "react";
import { Tldraw, createTLStore, getSnapshot, loadSnapshot, type Editor } from "tldraw";
import "tldraw/tldraw.css";
import { useWhiteboard } from "../hooks/useWhiteboard";
import * as Y from "yjs";
import { Socket } from "socket.io-client";

interface WhiteboardCanvasProps {
  ydoc: Y.Doc | null;
  socket: Socket | null;
  readOnly?: boolean;
}

const SYNC_DEBOUNCE_MS = 500;

export const WhiteboardCanvas = ({ ydoc, socket, readOnly }: WhiteboardCanvasProps) => {
  const { initialSnapshot, ready, pushSnapshot } = useWhiteboard(ydoc, socket);
  const isApplyingRemote = useRef(false);
  const storeRef = useRef<ReturnType<typeof createTLStore> | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<Editor | null>(null);

  const store = useMemo(() => createTLStore({ defaultName: "Whiteboard" }), []);

  storeRef.current = store;

  useEffect(() => {
    if (!ready || !store || !initialSnapshot) return;
    try {
      isApplyingRemote.current = true;
      const parsed = JSON.parse(initialSnapshot);
      loadSnapshot(store, parsed);
      editorRef.current?.setColorMode("dark");
    } catch {
    } finally {
      isApplyingRemote.current = false;
    }
  }, [ready, store, initialSnapshot]);

  useEffect(() => {
    if (!ready || !ydoc) return;

    const wbMap = ydoc.getMap<string>("wb");

    const observer = (events: Y.YMapEvent<string>, transaction: Y.Transaction) => {
      if (transaction.origin === "whiteboard:tldraw") return;
      if (!events.changes.keys.has("store")) return;

      const snapshotJson = wbMap.get("store");
      if (!snapshotJson) return;

      try {
        isApplyingRemote.current = true;
        loadSnapshot(store, JSON.parse(snapshotJson));
        editorRef.current?.setColorMode("dark");
      } catch {
      } finally {
        isApplyingRemote.current = false;
      }
    };

    wbMap.observe(observer);
    return () => wbMap.unobserve(observer);
  }, [ready, ydoc, store]);

  const debouncedSync = useCallback(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      if (isApplyingRemote.current) return;
      if (!storeRef.current) return;
      const snapshot = getSnapshot(storeRef.current);
      pushSnapshot(JSON.stringify(snapshot));
    }, SYNC_DEBOUNCE_MS);
  }, [pushSnapshot]);

  useEffect(() => {
    if (!ready || !store) return;

    const unsub = store.listen(() => {
      debouncedSync();
    });

    return () => {
      unsub?.();
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [ready, store, debouncedSync]);

  return (
    <div className="h-full w-full">
      <Tldraw
        store={store}
        onMount={(editor) => {
          editorRef.current = editor;
          editor.setColorMode("dark");
        }}
        options={{ maxPages: 1 }}
      />
    </div>
  );
};
