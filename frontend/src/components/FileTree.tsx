import { useState, useRef, useEffect, type FormEvent } from "react";
import { FiFile, FiFilePlus, FiTrash2, FiEdit3, FiCheck, FiX } from "react-icons/fi";
import type { FileEntry } from "../hooks/useCRDT";

const FILE_ICONS: Record<string, string> = {
  ts: "🔵",
  tsx: "⚛️",
  js: "🟡",
  jsx: "⚛️",
  css: "🎨",
  json: "📋",
  html: "🌐",
  md: "📝",
  py: "🐍",
  cpp: "⚡",
  c: "⚡",
};

const getIcon = (path: string) => {
  const ext = path.split(".").pop() || "";
  return FILE_ICONS[ext] || "📄";
};

const FileTree = ({
  files,
  activeFile,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  readOnly,
}: {
  files: FileEntry[];
  activeFile: string;
  onSelect: (path: string) => void;
  onCreate: (path: string) => boolean;
  onDelete: (path: string) => boolean;
  onRename: (path: string, newPath: string) => boolean;
  readOnly: boolean;
}) => {
  const [creating, setCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creating || renaming) {
      inputRef.current?.focus();
    }
  }, [creating, renaming]);

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const path = newFileName.trim();
    onCreate(path);
    setNewFileName("");
    setCreating(false);
  };

  const handleRename = (e: FormEvent) => {
    e.preventDefault();
    if (!renameValue.trim() || !renaming) return;
    onRename(renaming, renameValue.trim());
    setRenaming(null);
    setRenameValue("");
  };

  const handleContextRename = (path: string) => {
    setRenaming(path);
    setRenameValue(path);
  };

  return (
    <div className="select-none">
      <div className="flex items-center justify-between px-3 py-2 text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
        <span>Files</span>
        {!readOnly && (
          <button
            className="text-gray-500 hover:text-white transition-colors"
            onClick={() => setCreating(true)}
            title="New file"
          >
            <FiFilePlus size={13} />
          </button>
        )}
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="flex items-center gap-1 px-3 py-1">
          <span className="text-xs">{getIcon(newFileName || ".js")}</span>
          <input
            ref={inputRef}
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="index.ts"
            className="flex-1 bg-[#161b22] text-xs text-gray-200 outline-none border border-[#58a6ff] rounded px-1.5 py-0.5"
            onBlur={() => { if (!newFileName) setCreating(false); }}
            onKeyDown={(e) => e.key === "Escape" && setCreating(false)}
          />
        </form>
      )}

      <div className="space-y-0.5 px-1">
        {files.map((file) => (
          <div key={file.path} className="group relative">
            {renaming === file.path ? (
              <form onSubmit={handleRename} className="flex items-center gap-1 px-2 py-1">
                <input
                  ref={inputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="flex-1 bg-[#161b22] text-xs text-gray-200 outline-none border border-[#58a6ff] rounded px-1.5 py-0.5"
                  onBlur={() => setRenaming(null)}
                  onKeyDown={(e) => e.key === "Escape" && setRenaming(null)}
                />
                <button type="submit" className="text-green-500 hover:text-green-400">
                  <FiCheck size={12} />
                </button>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-300"
                  onClick={() => setRenaming(null)}
                >
                  <FiX size={12} />
                </button>
              </form>
            ) : (
              <button
                className={`w-full flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors ${
                  activeFile === file.path
                    ? "bg-[#1f6feb]/20 text-white"
                    : "text-gray-400 hover:text-gray-200 hover:bg-[#161b22]"
                }`}
                onClick={() => onSelect(file.path)}
              >
                <span className="text-[11px]">{getIcon(file.path)}</span>
                <span className="truncate flex-1 text-left">{file.path}</span>
                {!readOnly && (
                  <span className="hidden group-hover:flex items-center gap-0.5">
                    <span
                      className="p-0.5 rounded hover:bg-[#21262d] text-gray-500 hover:text-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContextRename(file.path);
                      }}
                    >
                      <FiEdit3 size={10} />
                    </span>
                    <span
                      className="p-0.5 rounded hover:bg-[#21262d] text-gray-500 hover:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(file.path);
                      }}
                    >
                      <FiTrash2 size={10} />
                    </span>
                  </span>
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileTree;
