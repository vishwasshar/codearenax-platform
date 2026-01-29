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
import ChatWidget from "../components/ChatWidget";
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

const TextEditor = () => {
  const [corner, setCorner] = useState<Corner>("bottom-right");

  const { token } = useSelector((state: any) => state.user);

  const { roomId } = useParams();
  const socket = useRoomSocket(token, roomId || "");
  const { ydoc, language, handleLangChange, roomMongooseId, roomRole } =
    useCRDT(socket);

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
      window.addEventListener("resize", () => fitAddOn?.fit());

      return () => {
        term.dispose();
        window.removeEventListener("resize", () => {});
      };
    }
  }, [terminalRef, editorKey.current, ydoc]);

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
      await authRequest.post("/run-code", {
        roomMongooseId,
      });
    } catch (err: any) {
      terminalInstance.current?.write(err.message + "\n");
    }
  }, [authRequest, roomMongooseId]);

  useEffect(() => {
    if (ydoc) {
      editorKey.current += 1;
    }
  }, [ydoc]);

  const handleEditorMount: OnMount = (editor) => {
    const yText = ydoc?.getText("monaco");
    const model = editor.getModel();

    if (!yText || !model) return;

    new MonacoBinding(yText, model, new Set([editor]));
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
        {roomRole != "viewer" && (
          <div className="ms-auto flex gap-2">
            <button
              className="btn btn-sm bg-success/80"
              onClick={handleCodeRun}
            >
              Save
            </button>
            <button className="btn btn-sm bg-accent/80" onClick={handleCodeRun}>
              Run
            </button>
          </div>
        )}
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
        <div className="editor-chat-container" ref={editorChatContainer}>
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
            <ChatWidget
              corner={corner}
              socket={socket}
              roomId={roomMongooseId}
            />
          </DndContext>
        </div>
      </Resizable>
      <div className="w-md h-1 mx-auto my-1 bg-base-100 rounded-4xl"></div>
      <div className="p-1 h-[100%] overflow-auto" style={{ flex: 1 }}>
        <div key={editorKey.current} ref={terminalRef} className="h-full"></div>
      </div>
    </div>
  );
};

export default TextEditor;
