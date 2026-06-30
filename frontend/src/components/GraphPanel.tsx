import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeProps,
  type NodeTypes,
  BackgroundVariant,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { GraphNodeData, ViewMode } from "../hooks/useCodeGraph";
import GraphToolbar from "./GraphToolbar";
import MermaidDiagram from "./MermaidDiagram";
import SigmaGraph from "./SigmaGraph";

function FunctionNode({ data }: NodeProps<Node<GraphNodeData>>) {
  const bgColor =
    data.type === "function"
      ? "bg-[#238636]"
      : data.type === "call"
        ? "bg-[#1f6feb]"
        : data.type === "file"
          ? "bg-[#6e40c9]"
          : "bg-[#9e6a03]";

  const typeLabel =
    data.type === "function" ? "fn"
    : data.type === "call" ? "call"
    : data.type === "file" ? "file"
    : "import";

  return (
    <div className="group">
      <Handle type="target" position={Position.Left} className="!bg-[#58a6ff]" />
      <div
        className={`
          ${bgColor} rounded-md border border-white/10 shadow-lg
          min-w-[140px] max-w-[220px] cursor-pointer
          transition-all duration-150
          hover:border-[#58a6ff]/60 hover:shadow-[#58a6ff]/10
        `}
      >
        <div className="flex items-center gap-1.5 px-2 py-1 border-b border-white/10">
          <span className="text-[10px] font-mono uppercase tracking-wider opacity-60">
            {typeLabel}
          </span>
          {data.lineNumber > 0 && (
            <span className="text-[10px] font-mono opacity-40 ml-auto">
              L{data.lineNumber}
            </span>
          )}
        </div>
        <div className="px-2 py-1.5">
          <div className="text-sm font-medium font-mono text-white truncate">
            {data.label}
          </div>
          {data.parameters && data.parameters.length > 0 && (
            <div className="text-[10px] font-mono text-gray-400 mt-0.5 truncate">
              ({data.parameters.join(", ")})
            </div>
          )}
          {data.args && data.args.length > 0 && (
            <div className="text-[10px] font-mono text-[#7ee787] mt-0.5 truncate">
              ({data.args.join(", ")})
            </div>
          )}
          {data.filePath && data.type === "file" && (
            <div className="text-[10px] font-mono text-gray-400 mt-0.5 truncate">
              {data.filePath}
            </div>
          )}
          {data.fileImport && !data.filePath && (
            <div className="text-[10px] font-mono text-gray-400 mt-0.5 truncate">
              from {data.fileImport}
            </div>
          )}
          {data.definitionFile && (
            <div className="text-[10px] font-mono text-[#f0883e] mt-0.5 truncate">
              → {data.definitionFile}
            </div>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-[#58a6ff]" />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  functionNode: FunctionNode,
};

interface GraphPanelProps {
  nodes: Node<GraphNodeData>[];
  edges: Edge[];
  loading: boolean;
  error: string | null;
  onNodeClick: (node: Node<GraphNodeData>) => void;
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
  cycles: string[][];
  useElkjs: boolean;
  onElkjsToggle: (on: boolean) => void;
  mermaidDef: string;
  availableFunctions: string[];
  selectedFunction: string;
  onSelectedFunctionChange: (fn: string) => void;
}

export default function GraphPanel({
  nodes,
  edges,
  loading,
  error,
  onNodeClick,
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
  cycles,
  useElkjs,
  onElkjsToggle,
  mermaidDef,
  availableFunctions,
  selectedFunction,
  onSelectedFunctionChange,
}: GraphPanelProps) {
  const isSequence = viewMode === "sequence-diagram";
  const isForce = viewMode === "force-graph";
  const showFlow = !isSequence && !isForce;

  const defaultEdgeOptions = useMemo(
    () => ({
      style: { stroke: "#30363d", strokeWidth: 1 },
      animated: true,
    }),
    [],
  );

  const cycleNodeIds = useMemo(() => {
    if (!cycles.length) return new Set<string>();
    return new Set(cycles.flat());
  }, [cycles]);

  const cycleEdges = useMemo(() => {
    if (!cycles.length) return new Set<string>();
    const s = new Set<string>();
    for (const cycle of cycles) {
      for (let i = 0; i < cycle.length; i++) {
        const src = cycle[i];
        const tgt = cycle[(i + 1) % cycle.length];
        s.add(`${src}->${tgt}`);
      }
    }
    return s;
  }, [cycles]);

  const edgeStyle = useMemo(
    () => (edge: Edge) => {
      const key = `${edge.source}->${edge.target}`;
      if (cycleEdges.has(key)) {
        return { stroke: "#da3633", strokeWidth: 2.5, strokeDasharray: "6 3" };
      }
      return edge.style || { stroke: "#30363d", strokeWidth: 1 };
    },
    [cycleEdges],
  );

  return (
    <div className="h-full w-full bg-[#0d1117] relative flex flex-col">
      <GraphToolbar
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        filterType={filterType}
        onFilterChange={onFilterChange}
        depthLimit={depthLimit}
        onDepthChange={onDepthChange}
        highlightCycles={highlightCycles}
        onCycleToggle={onCycleToggle}
        nodeCount={isSequence ? 0 : isForce ? nodes.length : nodes.length}
        useElkjs={useElkjs}
        onElkjsToggle={onElkjsToggle}
        availableFunctions={availableFunctions}
        selectedFunction={selectedFunction}
        onSelectedFunctionChange={onSelectedFunctionChange}
      />

      <div className="flex-1 relative">
        {loading && showFlow && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 bg-[#161b22]/80 backdrop-blur-sm rounded px-2 py-1 text-[11px] text-gray-400">
            <div className="w-2.5 h-2.5 border border-[#58a6ff] border-t-transparent rounded-full animate-spin" />
            Analyzing...
          </div>
        )}

        {cycles.length > 0 && showFlow && (
          <div className="absolute top-2 left-2 z-10 bg-red-900/50 backdrop-blur-sm rounded px-2 py-1 text-[10px] text-red-300">
            {cycles.length} cycle{cycles.length > 1 ? "s" : ""} detected
          </div>
        )}

        {error && showFlow && (
          <div className="absolute bottom-2 left-2 right-2 z-10 bg-red-900/60 backdrop-blur-sm rounded px-2 py-1 text-[11px] text-red-300">
            {error}
          </div>
        )}

        {showFlow && nodes.length === 0 && !loading && (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            <div className="text-center">
              <div className="text-2xl mb-2">○</div>
              <p>
                {viewMode === "call-graph"
                  ? "No functions detected"
                  : viewMode === "project-graph"
                    ? "No project data"
                    : "No files"}
              </p>
              <p className="text-xs mt-1 opacity-60">
                {viewMode === "call-graph"
                  ? "Start typing to see the call graph"
                  : "Open files to see project structure"}
              </p>
            </div>
          </div>
        )}

        {isSequence && (
          <MermaidDiagram definition={mermaidDef} />
        )}

        {isForce && (
          <SigmaGraph nodes={nodes} edges={edges} loading={loading} />
        )}

        {showFlow && nodes.length > 0 && (
          <ReactFlow
            nodes={nodes.map((n) => ({
              ...n,
              data: {
                ...n.data,
                className: cycleNodeIds.has(n.id) ? "ring-2 ring-red-500" : undefined,
              },
            }))}
            edges={edges.map((e) => ({
              ...e,
              style: edgeStyle(e),
            }))}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            onNodeClick={(_, node) => onNodeClick(node as Node<GraphNodeData>)}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            colorMode="dark"
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#1c2333"
            />
            <Controls
              className="!bg-[#161b22] !border-gray-700/50 [&_button]:!text-gray-400 [&_button]:!border-gray-700/50 [&_button:hover]:!bg-[#21262d] [&_button:hover]:!text-white"
            />
            <MiniMap
              className="!bg-[#161b22] !border-gray-700/50"
              nodeColor={(n) => (cycleNodeIds.has(n.id) ? "#da3633" : "#238636")}
              maskColor="rgba(13, 17, 23, 0.7)"
            />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
