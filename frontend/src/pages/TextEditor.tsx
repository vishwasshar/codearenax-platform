import { useCallback, useEffect, useRef, useState } from "react";

import Editor, { type OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { LangTypes } from "../commons/vars/lang-types";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "xterm-addon-fit";
import "@xterm/xterm/css/xterm.css";
import { authRequest } from "../utils/axios.interceptor";
import { useCRDT } from "../hooks/useCRDT";
import { MonacoBinding } from "y-monaco";

import "./textEditor.css";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";

import type { Corner } from "../commons/vars/corner-types";
import { getNearestCorner } from "../utils/getNearestCorner";
import { Resizable } from "re-resizable";
import { useRoomSocket } from "../hooks/useRoomSocket";
import { FaLongArrowAltLeft } from "react-icons/fa";
import ChatCallPanelLayout from "../components/ChatCallPanelLayout";
import CollaboratorsList from "../components/CollaboratorsList";

const TextEditor = () => {
  const [corner, setCorner] = useState<Corner>("bottom-right");

  const {
    token,
    name: userName,
    userId,
  } = useSelector((state: any) => state.user);

  const { roomId } = useParams();
  const socket = useRoomSocket(token, roomId || "");
  const {
    ydoc,
    awareness,
    language,
    handleLangChange,
    roomMongooseId,
    roomRole,
    handleCodeSave,
    saving,
  } = useCRDT(socket, userName);

  const terminalRef = useRef<HTMLDivElement | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const editorChatContainer = useRef<HTMLDivElement>(null);
  const editorKey = useRef(0);

  useEffect(() => {
    if (terminalRef.current) {
      const term = new Terminal({
        convertEol: true,
        cursorBlink: true,
        scrollback: 1000,
        fontSize: 14,
        theme: { background: "#1e1e1e" },
      });

      const fitAddOn = new FitAddon();
      term.loadAddon(fitAddOn);
      term.open(terminalRef.current);
      fitAddOn.fit();

      term.write("Welcome to Code Arena X Terminal\n");
      terminalInstance.current = term;
      fitAddonRef.current = fitAddOn;

      const handleResize = () => fitAddOn?.fit();
      window.addEventListener("resize", handleResize);

      return () => {
        term.dispose();
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [ydoc]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
    }

    if ((e.metaKey || e.ctrlKey) && (e.key === "Enter" || e.key == "'")) {
      e.preventDefault();
      handleCodeRun();
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleCodeValidation = (markers: monaco.editor.IMarker[]) => {
    markers.forEach((marker: monaco.editor.IMarker) => {
      console.log(marker.message);
    });
  };

  const handleCodeRun = useCallback(async () => {
    try {
      const res: any = await authRequest.post("/run-code", {
        roomId: roomMongooseId,
      });

      terminalInstance.current?.write(res.data.output || res.data.error + "\n");
    } catch (err: any) {
      terminalInstance.current?.write(err.message + "\n");
    }
  }, [authRequest, roomMongooseId]);

  useEffect(() => {
    if (ydoc) {
      editorKey.current += 1;
    }
  }, [ydoc]);

  useEffect(() => {
    if (!awareness) return;

    let styleEl = document.getElementById("remote-cursor-styles");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "remote-cursor-styles";
      document.head.appendChild(styleEl);
    }

    const updateCursorStyles = () => {
      const rules: string[] = [];
      awareness.getStates().forEach((state, clientID) => {
        if (clientID === awareness.clientID) return;
        const user = state.user as
          | { name?: string; color?: string }
          | undefined;
        if (!user?.color) return;

        const color = user.color;
        const name = user.name || "Unknown";
        rules.push(
          `.yRemoteSelection-${clientID} { background-color: ${color}44 !important; }`,
          `.yRemoteSelectionHead-${clientID} { border-left: 2px solid ${color} !important; position: relative; }`,
          `.yRemoteSelectionHead-${clientID}::after { content: '${name}'; position: absolute; top: -1.4em; left: -4px; font-size: 11px; padding: 1px 5px; border-radius: 3px 3px 3px 0; white-space: nowrap; color: #fff; background: ${color}; line-height: 1.4; opacity: 0; pointer-events: none; transition: opacity 0.12s ease; z-index: 10; }`,
          `.yRemoteSelectionHead-${clientID}:hover::after { opacity: 1; }`,
        );
      });
      styleEl!.textContent = rules.join("\n");
    };

    updateCursorStyles();
    awareness.on("change", updateCursorStyles);
    return () => {
      awareness.off("change", updateCursorStyles);
    };
  }, [awareness]);

  const handleEditorMount: OnMount = (editor) => {
    const yText = ydoc?.getText("monaco");
    const model = editor.getModel();

    if (!yText || !model) return;

    new MonacoBinding(yText, model, new Set([editor]), awareness);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!editorChatContainer?.current) return;

    const rect = editorChatContainer?.current?.getBoundingClientRect();

    const x = rect.width / 2 + event.delta.x;
    const y = rect.height / 2 + event.delta.y;

    setCorner(getNearestCorner(x, y, rect));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 15,
      },
    }),
  );

  const fitTerminal = () => {
    requestAnimationFrame(() => {
      fitAddonRef.current?.fit();
    });
  };

  return !ydoc ? (
    <div className="w-full h-screen flex flex-col gap-2 justify-center">
      <h2 className="text-center text-2xl ">Loading...</h2>
    </div>
  ) : (
    <div className="w-full h-screen flex flex-col">
      <div className="flex items-center h-fit px-2 py-1 gap-4">
        <Link to={"/rooms"} className="btn btn-sm">
          <FaLongArrowAltLeft /> All Rooms
        </Link>
        <select
          onChange={(e) => {
            handleLangChange(e.target.value);
          }}
          disabled={roomRole == "viewer"}
          value={language}
          className="select select-ghost w-50 capitalize"
        >
          {LangTypes.map((lang) => (
            <option value={lang} key={lang}>
              {lang}
            </option>
          ))}
        </select>
        <div className="ms-auto flex items-center gap-3">
          <CollaboratorsList socket={socket} currentUserId={userId} />
          {roomRole != "viewer" && (
            <div className="flex gap-2">
              <button
                className="btn btn-sm bg-success/80"
                onClick={handleCodeSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                className="btn btn-sm bg-accent/80"
                onClick={handleCodeRun}
              >
                Run
              </button>
            </div>
          )}
        </div>
      </div>
      <Resizable
        defaultSize={{
          height: "80%",
          width: "100%",
        }}
        maxHeight={"80%"}
        minHeight={150}
        enable={{ bottom: true }}
        onResize={() => {
          fitTerminal();
        }}
      >
        <div
          className="editor-chat-container relative"
          ref={editorChatContainer}
        >
          <Editor
            key={editorKey.current}
            className="flex-1"
            language={language}
            theme="vs-dark"
            onMount={handleEditorMount}
            onValidate={handleCodeValidation}
            options={{ readOnly: roomRole == "viewer" }}
          />
          <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
            <ChatCallPanelLayout
              corner={corner}
              socket={socket}
              roomMongooseId={roomMongooseId}
            />
          </DndContext>
        </div>
      </Resizable>
      <div className="w-md h-1 mx-auto my-1 bg-base-100 rounded-4xl"></div>
      <div className="p-1 h-[100%] overflow-auto" style={{ flex: 1 }}>
        <div ref={terminalRef} className="h-full"></div>
      </div>
    </div>
  );
};

export default TextEditor;
