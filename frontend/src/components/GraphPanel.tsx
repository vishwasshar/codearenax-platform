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
import type { GraphNodeData } from "../hooks/useCodeGraph";

function FunctionNode({ data }: NodeProps<Node<GraphNodeData>>) {
  const bgColor =
    data.type === "function"
      ? "bg-[#238636]"
      : data.type === "call"
        ? "bg-[#1f6feb]"
        : "bg-[#9e6a03]";

  const typeLabel =
    data.type === "function" ? "fn" : data.type === "call" ? "call" : "import";

  return (
    <div className="group">
      <Handle type="target" position={Position.Left} className="!bg-[#58a6ff]" />
      <div
        className={`
          ${bgColor} rounded-md border border-white/10 shadow-lg
          min-w-[160px] max-w-[240px] cursor-pointer
          transition-all duration-150
          hover:border-[#58a6ff]/60 hover:shadow-[#58a6ff]/10
        `}
      >
        <div className="flex items-center gap-1.5 px-2.5 py-1 border-b border-white/10">
          <span className="text-[10px] font-mono uppercase tracking-wider opacity-60">
            {typeLabel}
          </span>
          {data.lineNumber > 0 && (
            <span className="text-[10px] font-mono opacity-40 ml-auto">
              L{data.lineNumber}
            </span>
          )}
        </div>
        <div className="px-2.5 py-1.5">
          <div className="text-sm font-medium font-mono text-white truncate">
            {data.label}
          </div>
          {data.parameters && data.parameters.length > 0 && (
            <div className="text-[10px] font-mono text-gray-400 mt-0.5 truncate">
              ({data.parameters.join(", ")})
            </div>
          )}
          {data.fileImport && (
            <div className="text-[10px] font-mono text-gray-400 mt-0.5 truncate">
              from {data.fileImport}
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
}

export default function GraphPanel({
  nodes,
  edges,
  loading,
  error,
  onNodeClick,
}: GraphPanelProps) {
  const defaultEdgeOptions = useMemo(
    () => ({
      style: { stroke: "#30363d", strokeWidth: 1 },
      animated: true,
    }),
    [],
  );

  return (
    <div className="h-full w-full bg-[#0d1117] relative">
      {loading && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 bg-[#161b22]/80 backdrop-blur-sm rounded px-2 py-1 text-[11px] text-gray-400">
          <div className="w-2.5 h-2.5 border border-[#58a6ff] border-t-transparent rounded-full animate-spin" />
          Analyzing...
        </div>
      )}

      {error && (
        <div className="absolute bottom-2 left-2 right-2 z-10 bg-red-900/60 backdrop-blur-sm rounded px-2 py-1 text-[11px] text-red-300">
          {error}
        </div>
      )}

      {nodes.length === 0 && !loading && (
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
          <div className="text-center">
            <div className="text-2xl mb-2">○</div>
            <p>No functions detected</p>
            <p className="text-xs mt-1 opacity-60">
              Start typing to see the call graph
            </p>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
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
          nodeColor="#238636"
          maskColor="rgba(13, 17, 23, 0.7)"
        />
      </ReactFlow>
    </div>
  );
}
