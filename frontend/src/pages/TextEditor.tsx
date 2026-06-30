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
import { FaLongArrowAltLeft, FaPlay, FaSave, FaHistory, FaCog } from "react-icons/fa";
import { FiSidebar, FiFolder, FiFilePlus, FiGrid, FiShare2, FiCode } from "react-icons/fi";
import StatusBar from "../components/StatusBar";
import TerminalPanel, { type TerminalHandle } from "../components/TerminalPanel";
import CollabSidebar from "../components/CollabSidebar";
import FileTree from "../components/FileTree";
import TabBar from "../components/TabBar";
import { WhiteboardCanvas } from "../components/WhiteboardCanvas";
import { useCodeGraph } from "../hooks/useCodeGraph";
import type { ViewMode } from "../hooks/useCodeGraph";
import GraphPanel from "../components/GraphPanel";

const TextEditor = () => {
  const { token, name: userName, userId } = useSelector(
    (state: any) => state.user,
  );

  const { roomId } = useParams();
  const socket = useRoomSocket(token, roomId || "");
  const {
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
    roomName,
    handleCodeSave,
    saving,
  } = useCRDT(socket, userName);

  const [editorInstance, setEditorInstance] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const terminalRef = useRef<TerminalHandle | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fileTreeOpen, setFileTreeOpen] = useState(true);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(true);

  const handleCodeRun = useCallback(async () => {
    try {
      await authRequest.post("/run-code", {
        roomId: roomMongooseId,
        filePath: activeFile,
      });
    } catch (err: any) {
      terminalRef.current?.write("Run failed: " + err.message + "\n");
    }
  }, [roomMongooseId, activeFile]);

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
    if (!socket) return;
    const handleOutput = (output: string) => {
      terminalRef.current?.write(output + "\n");
    };
    socket.on("crdt:output", handleOutput);
    return () => { socket.off("crdt:output", handleOutput); };
  }, [socket]);

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

  const [graphViewMode, setGraphViewMode] = useState<ViewMode>("call-graph");
  const [graphSearch, setGraphSearch] = useState("");
  const [graphFilter, setGraphFilter] = useState("all");
  const [graphDepth, setGraphDepth] = useState(3);
  const [graphCycles, setGraphCycles] = useState(false);
  const [graphSelectedFunction, setGraphSelectedFunction] = useState("");
  const [graphUseElkjs, setGraphUseElkjs] = useState(false);

  const {
    nodes: graphNodes,
    edges: graphEdges,
    loading: graphLoading,
    error: graphError,
    cycles: graphCyclesList,
    mermaidDef: graphMermaidDef,
    availableFunctions: graphAvailableFunctions,
  } = useCodeGraph({
    ydoc,
    activeFile,
    files,
    viewMode: graphViewMode,
    searchQuery: graphSearch,
    filterType: graphFilter as any,
    depthLimit: graphDepth,
    highlightCycles: graphCycles,
    selectedFunction: graphSelectedFunction,
    useElkjs: graphUseElkjs,
  });

  useEffect(() => {
    if (graphViewMode === "sequence-diagram" && !graphSelectedFunction && graphAvailableFunctions.length > 0) {
      setGraphSelectedFunction(graphAvailableFunctions[0]);
    }
  }, [graphViewMode, graphAvailableFunctions, graphSelectedFunction]);

  const handleGraphNodeClick = useCallback(
    (node: any) => {
      if (!editorInstance) return;
      const line = node.data.lineNumber;
      if (line > 0) {
        editorInstance.revealPositionInCenter({ lineNumber: line, column: 1 });
        editorInstance.setPosition({ lineNumber: line, column: 1 });
        editorInstance.focus();
      }
    },
    [editorInstance],
  );

  const handleEditorMount: OnMount = (editor) => {
    setEditorInstance(editor);

    if (!activeFile || !ydoc) return;
    const yText = ydoc.getText(activeFile);
    const model = editor.getModel();
    if (!yText || !model) return;

    new MonacoBinding(yText, model, new Set([editor]), awareness);
  };

  useEffect(() => {
    const model = editorInstance?.getModel();
    if (!model) return;
    monaco.editor.setModelLanguage(model, language);
  }, [language, editorInstance]);

  useEffect(() => {
    setEditorInstance(null);
  }, [activeFile]);

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

        <span className="text-sm font-medium text-gray-200 truncate max-w-[200px]">
          {roomName || (roomMongooseId || roomId)?.slice(0, 8) + "…"}
        </span>

        <div className="w-px h-5 bg-gray-700/50 mx-1" />

        <button
          className={`p-1.5 rounded text-xs transition-colors ${
            fileTreeOpen
              ? "text-[#58a6ff] bg-[#58a6ff]/10"
              : "text-gray-400 hover:text-white hover:bg-[#21262d]"
          }`}
          onClick={() => setFileTreeOpen((p) => !p)}
          title="Toggle file tree"
        >
          <FiFolder size={18} />
        </button>

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
              editorOpen
                ? "text-[#58a6ff] bg-[#58a6ff]/10"
                : "text-gray-400 hover:text-white hover:bg-[#21262d]"
            }`}
            onClick={() => setEditorOpen((p) => !p)}
            title="Toggle editor"
          >
            <FiCode size={18} />
          </button>

          <button
            className={`p-1.5 rounded text-xs transition-colors ${
              graphOpen
                ? "text-[#58a6ff] bg-[#58a6ff]/10"
                : "text-gray-400 hover:text-white hover:bg-[#21262d]"
            }`}
            onClick={() => setGraphOpen((p) => !p)}
            title="Toggle call graph"
          >
            <FiShare2 size={18} />
          </button>

          <button
            className={`p-1.5 rounded text-xs transition-colors ${
              whiteboardOpen
                ? "text-[#58a6ff] bg-[#58a6ff]/10"
                : "text-gray-400 hover:text-white hover:bg-[#21262d]"
            }`}
            onClick={() => setWhiteboardOpen((p) => !p)}
            title="Toggle whiteboard"
          >
            <FiGrid size={18} />
          </button>

          <button
            className={`p-1.5 rounded text-xs transition-colors ${
              sidebarOpen
                ? "text-[#58a6ff] bg-[#58a6ff]/10"
                : "text-gray-400 hover:text-white hover:bg-[#21262d]"
            }`}
            onClick={() => setSidebarOpen((p) => !p)}
            title="Toggle collab sidebar"
          >
            <FiSidebar size={18} />
          </button>

          <Link
            to={`/room/${roomId}/replay`}
            className="p-1.5 rounded text-xs text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors"
            title="Replay"
          >
            <FaHistory size={14} />
          </Link>

          {roomRole === "owner" && (
            <Link
              to={`/update-room/${roomMongooseId || roomId}`}
              className="p-1.5 rounded text-xs text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors"
              title="Edit room"
            >
              <FaCog size={14} />
            </Link>
          )}

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

      {/* Main area: FileTree | Editor + Tabs | CollabSidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree */}
        {fileTreeOpen && (
          <div className="w-52 h-full overflow-y-auto bg-[#0d1117] border-r border-gray-700/50 flex-shrink-0">
            <FileTree
              files={files}
              activeFile={activeFile}
              onSelect={switchFile}
              onCreate={createFile}
              onDelete={deleteFile}
              onRename={renameFile}
              readOnly={roomRole == "viewer"}
            />
          </div>
        )}

        {/* Editor + Graph panel wrapper */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor / Whiteboard area */}
          {whiteboardOpen ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 relative overflow-hidden">
                <WhiteboardCanvas
                  ydoc={ydoc}
                  socket={socket}
                  readOnly={roomRole == "viewer"}
                />
              </div>
            </div>
          ) : editorOpen ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <TabBar
                files={files}
                activeFile={activeFile}
                onSelect={switchFile}
                onClose={deleteFile}
                readOnly={roomRole == "viewer"}
              />
              <div className="flex-1 relative overflow-hidden">
                {files.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-500">
                    <div className="text-5xl">📄</div>
                    <p className="text-sm">No files open</p>
                    {roomRole !== "viewer" && (
                      <button
                        className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium bg-[#238636] text-white hover:bg-[#2ea043] transition-colors"
                        onClick={() => {
                          const name = prompt("File name:", "index.ts");
                          if (name) createFile(name);
                        }}
                      >
                        <FiFilePlus size={14} />
                        New file
                      </button>
                    )}
                  </div>
                ) : activeFile ? (
                  <Editor
                    key={`editor-${activeFile}`}
                    className="h-full"
                    language={language}
                    theme="vs-dark"
                    onMount={handleEditorMount}
                    options={{ readOnly: roomRole == "viewer" }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                    Select a file to start editing
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Graph panel */}
          {graphOpen && (
            <div className={`${whiteboardOpen || editorOpen ? 'w-80' : 'flex-1'} border-l border-gray-700/50 flex-shrink-0`}>
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-gray-700/30 select-none">
                  <span className="text-xs font-medium text-gray-300">
                    CALL GRAPH
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {graphNodes.length} nodes
                  </span>
                </div>
                <div className="flex-1 relative overflow-hidden">
                  <GraphPanel
                    nodes={graphNodes}
                    edges={graphEdges}
                    loading={graphLoading}
                    error={graphError}
                    onNodeClick={handleGraphNodeClick}
                    viewMode={graphViewMode}
                    onViewModeChange={setGraphViewMode}
                    searchQuery={graphSearch}
                    onSearchChange={setGraphSearch}
                    filterType={graphFilter}
                    onFilterChange={setGraphFilter}
                    depthLimit={graphDepth}
                    onDepthChange={setGraphDepth}
                    highlightCycles={graphCycles}
                    onCycleToggle={setGraphCycles}
                    cycles={graphCyclesList}
                    useElkjs={graphUseElkjs}
                    onElkjsToggle={setGraphUseElkjs}
                    mermaidDef={graphMermaidDef}
                    availableFunctions={graphAvailableFunctions}
                    selectedFunction={graphSelectedFunction}
                    onSelectedFunctionChange={setGraphSelectedFunction}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Collab Sidebar */}
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
