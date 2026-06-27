import { useCallback, useEffect, useRef, useState } from "react";

import Editor, { type OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { LangTypes } from "../commons/vars/lang-types";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { authRequest } from "../utils/axios.interceptor";
import { useCRDT } from "../hooks/useCRDT";
import { MonacoBinding } from "y-monaco";

import "./textEditor.css";
import { useRoomSocket } from "../hooks/useRoomSocket";
import { FaLongArrowAltLeft, FaPlay, FaSave, FaHistory } from "react-icons/fa";
import { FiSidebar } from "react-icons/fi";
import StatusBar from "../components/StatusBar";
import TerminalPanel, {
  type TerminalHandle,
} from "../components/TerminalPanel";
import CollabSidebar from "../components/CollabSidebar";

const TextEditor = () => {
  const { token, name: userName, userId } = useSelector(
    (state: any) => state.user,
  );

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

  const editorKey = useRef(0);
  const [editorInstance, setEditorInstance] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const terminalRef = useRef<TerminalHandle | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (ydoc) {
      editorKey.current += 1;
    }
  }, [ydoc]);

  const handleCodeRun = useCallback(async () => {
    try {
      const res: any = await authRequest.post("/run-code", {
        roomId: roomMongooseId,
      });
      terminalRef.current?.write(
        res.data.output || res.data.error + "\n",
      );
    } catch (err: any) {
      terminalRef.current?.write(err.message + "\n");
    }
  }, [roomMongooseId]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "Enter" || e.key == "'")) {
        e.preventDefault();
        handleCodeRun();
      }
    },
    [handleCodeRun],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

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
    setEditorInstance(editor);

    const yText = ydoc?.getText("monaco");
    const model = editor.getModel();
    if (!yText || !model) return;

    new MonacoBinding(yText, model, new Set([editor]), awareness);
  };

  useEffect(() => {
    const model = editorInstance?.getModel();
    if (!model) return;
    monaco.editor.setModelLanguage(model, language);
  }, [language, editorInstance]);

  return !ydoc ? (
    <div className="w-full h-screen flex flex-col gap-2 justify-center items-center bg-[#0d1117]">
      <div className="animate-spin w-8 h-8 border-2 border-[#58a6ff] border-t-transparent rounded-full" />
      <h2 className="text-gray-400 text-sm">Loading editor...</h2>
    </div>
  ) : (
    <div className="w-full h-screen flex flex-col bg-[#0d1117] text-gray-200">
      {/* Top Toolbar */}
      <div className="flex items-center h-10 px-3 bg-[#161b22] border-b border-gray-700/50 gap-2 select-none">
        <Link
          to={"/rooms"}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-xs"
        >
          <FaLongArrowAltLeft />
          <span className="hidden sm:inline">All Rooms</span>
        </Link>

        <div className="w-px h-5 bg-gray-700/50 mx-1" />

        <select
          onChange={(e) => handleLangChange(e.target.value)}
          disabled={roomRole == "viewer"}
          value={language}
          className="bg-transparent text-xs text-gray-300 outline-none border border-gray-700/50 rounded px-1.5 py-0.5 capitalize cursor-pointer hover:border-gray-600"
        >
          {LangTypes.map((lang) => (
            <option value={lang} key={lang}>
              {lang}
            </option>
          ))}
        </select>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <button
            className={`p-1.5 rounded text-xs transition-colors ${
              sidebarOpen
                ? "text-[#58a6ff] bg-[#58a6ff]/10"
                : "text-gray-400 hover:text-white hover:bg-[#21262d]"
            }`}
            onClick={() => setSidebarOpen((p) => !p)}
            title="Toggle sidebar"
          >
            <FiSidebar size={15} />
          </button>

          <Link
            to={`/room/${roomId}/replay`}
            className="p-1.5 rounded text-xs text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors"
            title="Replay"
          >
            <FaHistory size={14} />
          </Link>

          {roomRole != "viewer" && (
            <>
              <button
                className="p-1.5 rounded text-xs text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors disabled:opacity-40"
                onClick={handleCodeSave}
                disabled={saving}
                title="Save"
              >
                <FaSave size={14} />
              </button>
              <button
                className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-[#238636] text-white hover:bg-[#2ea043] transition-colors"
                onClick={handleCodeRun}
                title="Run (⌘⏎)"
              >
                <FaPlay size={10} />
                <span>Run</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor + Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative overflow-hidden">
          <Editor
            key={editorKey.current}
            className="h-full"
            language={language}
            theme="vs-dark"
            onMount={handleEditorMount}
            options={{ readOnly: roomRole == "viewer" }}
          />
        </div>

        {sidebarOpen && (
          <CollabSidebar
            socket={socket}
            roomMongooseId={roomMongooseId}
            currentUserId={userId}
            editorInstance={editorInstance}
            roomRole={roomRole}
          />
        )}
      </div>

      {/* Status Bar */}
      <StatusBar
        editorInstance={editorInstance}
        language={language}
        socket={socket}
        roomRole={roomRole}
        currentUserId={userId}
        roomId={roomMongooseId || roomId || ""}
      />

      {/* Terminal */}
      <TerminalPanel ref={terminalRef} />
    </div>
  );
};

export default TextEditor;
