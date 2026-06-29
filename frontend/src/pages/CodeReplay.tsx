import { type OnMount } from "@monaco-editor/react";
import Editor from "@monaco-editor/react";
import { Link, useParams } from "react-router-dom";
import { useCodeReplay } from "../hooks/useCodeReplay";
import { FaLongArrowAltLeft, FaPlay, FaPause, FaUndo, FaHistory } from "react-icons/fa";
import { FiFolder, FiChevronRight, FiChevronDown } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";

const FILE_ICONS: Record<string, string> = {
  ts: "🔵", tsx: "⚛️", js: "🟡", jsx: "⚛️",
  css: "🎨", json: "📋", html: "🌐", md: "📝",
  py: "🐍", cpp: "⚡", c: "⚡",
};

const getIcon = (path: string) => {
  const ext = path.split(".").pop() || "";
  return FILE_ICONS[ext] || "📄";
};

type TreeNode = {
  name: string;
  type: "file" | "directory";
  path: string;
  children: TreeNode[];
};

function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const filePath of paths) {
    const parts = filePath.split("/");
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      if (isLast) {
        current.push({ name: part, type: "file", path: filePath, children: [] });
      } else {
        let dir = current.find((n) => n.type === "directory" && n.name === part);
        if (!dir) {
          dir = { name: part, type: "directory", path: parts.slice(0, i + 1).join("/"), children: [] };
          current.push(dir);
        }
        current = dir.children;
      }
    }
  }
  return root.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

const ReplayFileTree = ({
  filePaths,
  selectedFile,
  onSelect,
}: {
  filePaths: string[];
  selectedFile: string;
  onSelect: (path: string) => void;
}) => {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const tree = buildTree(filePaths);

  const toggleCollapse = (dirPath: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(dirPath)) next.delete(dirPath);
      else next.add(dirPath);
      return next;
    });
  };

  const sortChildren = (nodes: TreeNode[]): TreeNode[] =>
    [...nodes].sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  const renderNode = (node: TreeNode, depth: number) => {
    if (node.type === "directory") {
      const isCollapsed = collapsed.has(node.path);
      return (
        <div key={node.path}>
          <button
            className="w-full flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-gray-200 hover:bg-[#161b22] transition-colors"
            style={{ paddingLeft: `${8 + depth * 14}px` }}
            onClick={() => toggleCollapse(node.path)}
          >
            <span className="text-[10px] w-3">
              {isCollapsed ? <FiChevronRight size={11} /> : <FiChevronDown size={11} />}
            </span>
            <FiFolder size={13} className="text-[#58a6ff]" />
            <span className="truncate flex-1 text-left text-gray-400 font-medium">{node.name}</span>
          </button>
          {!isCollapsed && (
            <div>
              {sortChildren(node.children).map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={node.path}
        className={`w-full flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors ${
          selectedFile === node.path
            ? "bg-[#1f6feb]/20 text-white"
            : "text-gray-400 hover:text-gray-200 hover:bg-[#161b22]"
        }`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => onSelect(node.path)}
      >
        <span className="text-[10px] w-3 opacity-0">-</span>
        <span className="text-[11px]">{getIcon(node.path)}</span>
        <span className="truncate flex-1 text-left">{node.name}</span>
      </button>
    );
  };

  return (
    <div className="space-y-0.5 px-1">
      {tree.map((node) => renderNode(node, 0))}
    </div>
  );
};

const CodeReplay = () => {
  const [editorKey, setEditorKey] = useState(0);
  const [fileTreeOpen, setFileTreeOpen] = useState(true);
  const { roomId } = useParams();
  const {
    texts,
    lang,
    files,
    editedFiles,
    selectedFile,
    setSelectedFile,
    isPlaying,
    isFinished,
    currentIndex,
    total,
    loading,
    speed,
    play,
    pause,
    reset: hookReset,
    setSpeed,
    onUpdateRef,
  } = useCodeReplay(roomId || "");

  const reset = () => {
    hookReset();
    setEditorKey((k) => k + 1);
  };

  const handleEditorMount: OnMount = (editor) => {
    const model = editor.getModel();
    if (!model) return;

    const initialText = texts[currentIndex] || texts[0] || "";
    model.setValue(initialText);

    onUpdateRef.current = (text: string) => {
      if (text !== model.getValue()) {
        model.setValue(text);
      }
    };
  };

  const progress = total > 0 ? Math.round((currentIndex / total) * 100) : 0;

  useEffect(() => {
    setEditorKey((k) => k + 1);
  }, [selectedFile]);

  const replayFilePaths = [...new Set(editedFiles)];

  return (
    <div className="w-full h-screen flex flex-col bg-[#0d1117] text-gray-200">
      {/* Top Toolbar */}
      <div className="flex items-center h-10 px-3 bg-[#161b22] border-b border-gray-700/50 gap-2 select-none">
        <Link
          to={`/room/${roomId}`}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-xs"
        >
          <FaLongArrowAltLeft />
          <span className="hidden sm:inline">Back to Editor</span>
        </Link>

        <div className="w-px h-5 bg-gray-700/50 mx-1" />

        <button
          className={`p-1.5 rounded text-xs transition-colors ${
            fileTreeOpen
              ? "text-[#58a6ff] bg-[#58a6ff]/10"
              : "text-gray-400 hover:text-white hover:bg-[#21262d]"
          }`}
          onClick={() => setFileTreeOpen((p) => !p)}
          title="Toggle file list"
        >
          <FiFolder size={15} />
        </button>

        <div className="flex items-center gap-2">
          <FaHistory className="text-[#58a6ff]" size={14} />
          <span className="font-semibold text-sm text-gray-200">Code Replay</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          {!isPlaying ? (
            <button
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-[#238636] text-white hover:bg-[#2ea043] transition-colors disabled:opacity-40"
              onClick={play}
              disabled={loading || total === 0 || isFinished}
            >
              <FaPlay size={10} /> {isFinished ? "Replay" : "Play"}
            </button>
          ) : (
            <button
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-[#d29922] text-white hover:bg-[#bb8009] transition-colors"
              onClick={pause}
            >
              <FaPause size={10} /> Pause
            </button>
          )}
          <button
            className="p-1.5 rounded text-xs text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors disabled:opacity-40"
            onClick={reset}
            disabled={currentIndex === 0 && !isFinished}
            title="Reset"
          >
            <FaUndo size={14} />
          </button>

          <div className="w-px h-5 bg-gray-700/50 mx-1" />

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500">Speed:</span>
            <select
              className="bg-transparent text-xs text-gray-300 outline-none border border-gray-700/50 rounded px-1.5 py-0.5 cursor-pointer hover:border-gray-600"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              <option value={1}>1x</option>
              <option value={5}>5x</option>
              <option value={10}>10x</option>
              <option value={50}>50x</option>
              <option value={100}>100x</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main area: File list | Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* File tree sidebar */}
        {fileTreeOpen && (
          <div className="w-52 h-full overflow-y-auto bg-[#0d1117] border-r border-gray-700/50 flex-shrink-0">
            <div className="flex items-center justify-between px-3 py-2 text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
              <span>Replay Files</span>
            </div>
            {replayFilePaths.length === 0 ? (
              <div className="px-3 py-4 text-xs text-gray-500 text-center">
                No replay data available
              </div>
            ) : (
              <ReplayFileTree
                filePaths={replayFilePaths}
                selectedFile={selectedFile}
                onSelect={setSelectedFile}
              />
            )}
          </div>
        )}

        {/* Editor area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab-like header for selected file */}
          {selectedFile && replayFilePaths.length > 0 && (
            <div className="flex items-center bg-[#161b22] border-b border-gray-700/50 overflow-x-auto">
              <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#0d1117] text-white border-r border-gray-700/30 border-t-2 border-t-[#58a6ff]">
                <span className="text-[10px]">{getIcon(selectedFile)}</span>
                <span>{selectedFile}</span>
              </div>
            </div>
          )}

          {/* Editor / Loading / Empty state */}
          <div className="flex-1 relative overflow-hidden">
            {loading ? (
              <div className="h-full flex flex-col gap-2 justify-center items-center">
                <div className="animate-spin w-8 h-8 border-2 border-[#58a6ff] border-t-transparent rounded-full" />
                <h2 className="text-gray-400 text-sm">Loading replay data...</h2>
              </div>
            ) : total === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-500">
                <FaHistory size={40} className="text-gray-600" />
                <p className="text-sm">
                  {selectedFile ? `No edits recorded for ${selectedFile}` : "Select a file to replay"}
                </p>
                {selectedFile && !replayFilePaths.includes(selectedFile) && (
                  <p className="text-xs text-gray-600">
                    This file exists in the room but has no edit history
                  </p>
                )}
              </div>
            ) : (
              <Editor
                key={editorKey}
                className="h-full"
                language={lang}
                theme="vs-dark"
                onMount={handleEditorMount}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  padding: { top: 12 },
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom progress bar */}
      {total > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-[#161b22] border-t border-gray-700/50 text-sm">
          <div className="flex-1 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#58a6ff] transition-all duration-150 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-gray-400 whitespace-nowrap">
            {currentIndex} / {total} edits
          </span>
        </div>
      )}
    </div>
  );
};

export default CodeReplay;