import { useState, useRef, useEffect, type FormEvent } from "react";
import { FiFile, FiFilePlus, FiTrash2, FiEdit3, FiCheck, FiX, FiChevronRight, FiChevronDown, FiFolder } from "react-icons/fi";
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

const getDirName = (path: string) => {
  const parts = path.split("/");
  return parts[parts.length - 2] || "";
};

type TreeNode = {
  name: string;
  type: "file" | "directory";
  path: string;
  children: TreeNode[];
};

function buildTree(files: FileEntry[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (isLast) {
        current.push({ name: part, type: "file", path: file.path, children: [] });
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

  return root;
}

function sortTree(nodes: TreeNode[]): TreeNode[] {
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

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
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const tree = sortTree(buildTree(files));

  useEffect(() => {
    if (creating || renaming) {
      inputRef.current?.focus();
    }
  }, [creating, renaming]);

  useEffect(() => {
    if (creating && newFileName.includes("/")) {
      const dir = newFileName.split("/").slice(0, -1).join("/");
      setCollapsed((prev) => {
        const next = new Set(prev);
        next.delete(dir);
        return next;
      });
    }
  }, [newFileName]);

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

  const toggleCollapse = (dirPath: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(dirPath)) next.delete(dirPath);
      else next.add(dirPath);
      return next;
    });
  };

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
              {sortTree(node.children).map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={node.path} className="group relative">
        {renaming === node.path ? (
          <form onSubmit={handleRename} className="flex items-center gap-1 px-2 py-1" style={{ paddingLeft: `${8 + depth * 14}px` }}>
            <span className="text-xs">{getIcon(renameValue || node.name)}</span>
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
              activeFile === node.path
                ? "bg-[#1f6feb]/20 text-white"
                : "text-gray-400 hover:text-gray-200 hover:bg-[#161b22]"
            }`}
            style={{ paddingLeft: `${8 + depth * 14}px` }}
            onClick={() => onSelect(node.path)}
          >
            <span className="text-[10px] w-3 opacity-0">-</span>
            <span className="text-[11px]">{getIcon(node.path)}</span>
            <span className="truncate flex-1 text-left">{node.name}</span>
            {!readOnly && (
              <span className="hidden group-hover:flex items-center gap-0.5">
                <span
                  className="p-0.5 rounded hover:bg-[#21262d] text-gray-500 hover:text-gray-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextRename(node.path);
                  }}
                >
                  <FiEdit3 size={10} />
                </span>
                <span
                  className="p-0.5 rounded hover:bg-[#21262d] text-gray-500 hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(node.path);
                  }}
                >
                  <FiTrash2 size={10} />
                </span>
              </span>
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="select-none">
      <div className="flex items-center justify-between px-3 py-2 text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
        <span>Files</span>
        {!readOnly && (
          <button
            className="text-gray-500 hover:text-white transition-colors"
            onClick={() => { setCreating(true); setNewFileName(""); }}
            title="New file"
          >
            <FiFilePlus size={13} />
          </button>
        )}
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="flex items-center gap-1 px-1 py-1">
          <span className="text-xs pl-2">{getIcon(newFileName || ".js")}</span>
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
        {tree.map((node) => renderNode(node, 0))}
      </div>

      {files.length === 0 && !creating && (
        <div className="px-3 py-4 text-xs text-gray-500 text-center">
          {readOnly ? "No files" : "No files — click + to create one"}
        </div>
      )}
    </div>
  );
};

export default FileTree;