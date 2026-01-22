import { useCallback, useEffect, useRef, useState } from "react";

import Editor, { type OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { LangTypes } from "../commons/vars/lang-types";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "xterm-addon-fit";
import "@xterm/xterm/css/xterm.css";
import { authRequest } from "../utils/axios.interceptor";
import { useCRDTHook } from "../hooks/useCRDTHook";
import { MonacoBinding } from "y-monaco";

import "./textEditor.css";
import FloatingWidget from "../components/FloatingWidget";
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

const TextEditor = () => {
  const [corner, setCorner] = useState<Corner>("bottom-right");

  const {
    user: { token },
  } = useSelector((state: any) => state.user);

  const { roomId } = useParams();
  const { ydoc, language, handleLangChange } = useCRDTHook(
    token || "",
    roomId || "",
  );

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
  }, [terminalRef, editorKey.current]);

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
        roomId,
      });
    } catch (err: any) {
      terminalInstance.current?.write(err.message + "\n");
    }
  }, [authRequest, roomId]);

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
    <div className="w-full h-screen flex flex-col gap-2">
      <div className="flex justify-between h-fit">
        <select
          onChange={(e) => {
            handleLangChange(e.target.value);
          }}
          value={language}
          className="select select-ghost w-50"
        >
          {LangTypes.map((lang) => (
            <option value={lang} key={lang}>
              {lang}
            </option>
          ))}
        </select>
        <button className="btn btn-ghost" onClick={handleCodeRun}>
          Run
        </button>
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
          />
          <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
            <FloatingWidget corner={corner} />
          </DndContext>
        </div>
      </Resizable>
      <div className="p-1 h-[100%] overflow-auto" style={{ flex: 1 }}>
        <div key={editorKey.current} ref={terminalRef} className="h-full"></div>
      </div>
    </div>
  );
};

export default TextEditor;
