import { useCallback, useEffect, useRef } from "react";

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

const TextEditor = () => {
  const {
    user: { token },
  } = useSelector((state: any) => state.user);

  const { roomId } = useParams();
  const { ydoc, language, handleLangChange } = useCRDTHook(
    token || "",
    roomId || "",
  );

  const terminalRef = useRef<HTMLDivElement | null>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const editorKey = useRef(0);

  useEffect(() => {
    if (terminalRef.current) {
      const term = new Terminal({
        convertEol: true,
        fontSize: 14,
        theme: { background: "#1e1e1e" },
      });

      const fitAddOn = new FitAddon();
      term.loadAddon(fitAddOn);
      term.open(terminalRef.current);
      fitAddOn.fit();

      term.write("Welcome to Code Arena X Terminal\n");
      terminalInstance.current = term;
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
      <Editor
        key={editorKey.current}
        className="flex-1"
        language={language}
        theme="vs-dark"
        onMount={handleEditorMount}
        onValidate={handleCodeValidation}
      />
      <div className="h-2/12 p-1">
        <div
          key={editorKey.current}
          ref={terminalRef}
          style={{ height: "100%", width: "100%" }}
        ></div>
      </div>
    </div>
  );
};

export default TextEditor;
