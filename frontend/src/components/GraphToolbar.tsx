import type { ViewMode } from "../hooks/useCodeGraph";

interface GraphToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterType: string;
  onFilterChange: (type: string) => void;
  depthLimit: number;
  onDepthChange: (depth: number) => void;
  highlightCycles: boolean;
  onCycleToggle: (on: boolean) => void;
  nodeCount: number;
  useElkjs: boolean;
  onElkjsToggle: (on: boolean) => void;
  availableFunctions: string[];
  selectedFunction: string;
  onSelectedFunctionChange: (fn: string) => void;
}

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "call-graph", label: "Call Graph" },
  { value: "project-graph", label: "Project" },
  { value: "file-tree", label: "File Tree" },
  { value: "sequence-diagram", label: "Sequence" },
  { value: "force-graph", label: "Force Graph" },
];

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "function", label: "Functions" },
  { value: "file", label: "Files" },
  { value: "import", label: "Imports" },
];

export default function GraphToolbar({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  filterType,
  onFilterChange,
  depthLimit,
  onDepthChange,
  highlightCycles,
  onCycleToggle,
  nodeCount,
  useElkjs,
  onElkjsToggle,
  availableFunctions,
  selectedFunction,
  onSelectedFunctionChange,
}: GraphToolbarProps) {
  const isSequence = viewMode === "sequence-diagram";
  const isForce = viewMode === "force-graph";
  const showFilter = !isSequence && !isForce;
  const showSearch = !isSequence;
  const showDepth = !isSequence && !isForce;

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-[#161b22] border-b border-gray-700/30 select-none">
      <select
        className="bg-transparent text-[11px] text-gray-300 outline-none border border-gray-700/50 rounded px-1.5 py-0.5 cursor-pointer hover:border-gray-600"
        value={viewMode}
        onChange={(e) => onViewModeChange(e.target.value as ViewMode)}
      >
        {VIEW_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <div className="w-px h-4 bg-gray-700/50" />

      {showSearch && (
        <div className="relative flex-1 max-w-[140px]">
          <input
            className="w-full bg-transparent text-[11px] text-gray-300 outline-none border border-gray-700/50 rounded px-1.5 py-0.5 placeholder-gray-600"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}

      {isSequence && availableFunctions.length > 0 && (
        <select
          className="bg-transparent text-[11px] text-gray-300 outline-none border border-gray-700/50 rounded px-1.5 py-0.5 cursor-pointer hover:border-gray-600 max-w-[140px]"
          value={selectedFunction}
          onChange={(e) => onSelectedFunctionChange(e.target.value)}
        >
          {availableFunctions.map((fn) => (
            <option key={fn} value={fn}>
              {fn}
            </option>
          ))}
        </select>
      )}

      {showFilter && (
        <select
          className="bg-transparent text-[11px] text-gray-300 outline-none border border-gray-700/50 rounded px-1.5 py-0.5 cursor-pointer hover:border-gray-600"
          value={filterType}
          onChange={(e) => onFilterChange(e.target.value)}
        >
          {FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {showDepth && (
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-500">D:</span>
          <select
            className="bg-transparent text-[11px] text-gray-300 outline-none border border-gray-700/50 rounded px-1 py-0.5 cursor-pointer hover:border-gray-600"
            value={depthLimit}
            onChange={(e) => onDepthChange(Number(e.target.value))}
          >
            {[0, 1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>
                {d === 0 ? "∞" : String(d)}
              </option>
            ))}
          </select>
        </div>
      )}

      {showFilter && (
        <button
          className={`p-1 rounded text-[11px] transition-colors ${
            highlightCycles
              ? "text-red-400 bg-red-900/20"
              : "text-gray-500 hover:text-gray-300"
          }`}
          onClick={() => onCycleToggle(!highlightCycles)}
          title="Highlight cycles"
        >
          ⟳
        </button>
      )}

      <button
        className={`p-1 rounded text-[11px] transition-colors ${
          useElkjs
            ? "text-[#58a6ff] bg-[#58a6ff]/10"
            : "text-gray-500 hover:text-gray-300"
        }`}
        onClick={() => onElkjsToggle(!useElkjs)}
        title="Use Elkjs layout"
      >
        ⊞
      </button>

      <div className="ml-auto text-[10px] text-gray-500 font-mono">
        {nodeCount}
      </div>
    </div>
  );
}
