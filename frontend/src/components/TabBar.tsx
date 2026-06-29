import { type FileEntry } from "../hooks/useCRDT";
import { FiX } from "react-icons/fi";

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

const TabBar = ({
  files,
  activeFile,
  onSelect,
  onClose,
  readOnly,
}: {
  files: FileEntry[];
  activeFile: string;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
  readOnly: boolean;
}) => {
  return (
    <div className="flex items-center bg-[#161b22] border-b border-gray-700/50 overflow-x-auto">
      {files.map((file) => (
        <div
          key={file.path}
          className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs border-r border-gray-700/30 cursor-pointer transition-colors whitespace-nowrap ${
            activeFile === file.path
              ? "bg-[#0d1117] text-white border-t-2 border-t-[#58a6ff] mt-0"
              : "text-gray-400 hover:text-gray-200 hover:bg-[#21262d]"
          }`}
          onClick={() => onSelect(file.path)}
        >
          <span className="text-[10px]">{getIcon(file.path)}</span>
          <span>{file.path.split("/").pop()}</span>
          {file.path.includes("/") && (
            <span className="text-[9px] text-gray-600 ml-0.5 truncate max-w-[60px]">{file.path.split("/").slice(0, -1).join("/")}</span>
          )}
          {!readOnly && files.length > 1 && (
            <span
              className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[#30363d] text-gray-500 hover:text-gray-200 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onClose(file.path);
              }}
            >
              <FiX size={11} />
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default TabBar;
