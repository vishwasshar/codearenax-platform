import { useEffect, useRef } from "react";
import type { Node, Edge } from "@xyflow/react";
import type { GraphNodeData } from "../hooks/useCodeGraph";

interface SigmaGraphProps {
  nodes: Node<GraphNodeData>[];
  edges: Edge[];
  loading: boolean;
}

export default function SigmaGraph({ nodes, edges, loading }: SigmaGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{ killed: boolean; sigma: any }>({ killed: false, sigma: null });

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    const el = containerRef.current;
    stateRef.current.killed = false;

    (async () => {
      try {
        const Graph = (await import("graphology")).default;
        const Sigma = (await import("sigma")).default;
        const forceAtlas2 = (await import("graphology-layout-forceatlas2")).default;

        if (stateRef.current.killed || !el.isConnected) return;

        const graph = new Graph({ multi: true });

        nodes.forEach((n) => {
          const data = n.data;
          const color =
            data.type === "function" ? "#238636"
            : data.type === "call" ? "#1f6feb"
            : data.type === "file" ? "#6e40c9"
            : "#9e6a03";
          graph.addNode(n.id, {
            label: data.label,
            size: data.type === "file" ? 12 : 8,
            color,
            x: Math.random(),
            y: Math.random(),
          });
        });

        edges.forEach((e) => {
          if (graph.hasNode(e.source) && graph.hasNode(e.target)) {
            graph.addEdge(e.source, e.target, {
              color: "#30363d",
              size: 0.5,
            });
          }
        });

        const settings = forceAtlas2.inferSettings(graph);
        forceAtlas2.assign(graph, {
          settings,
          iterations: 100,
        });

        if (stateRef.current.killed || !el.isConnected) return;

        const sigma = new Sigma(graph, el, {
          renderEdgeLabels: false,
          enableEdgeEvents: true,
          labelColor: { color: "#8b949e" },
          labelSize: 10,
          labelFont: "JetBrains Mono, monospace",
          defaultEdgeColor: "#30363d",
          edgeLabelSize: 8,
          minCameraRatio: 0.1,
          maxCameraRatio: 10,
        });

        stateRef.current.sigma = sigma;
      } catch (err: any) {
        console.error("Sigma render error:", err);
      }
    })();

    return () => {
      stateRef.current.killed = true;
      if (stateRef.current.sigma) {
        stateRef.current.sigma.kill();
        stateRef.current.sigma = null;
      }
    };
  }, [nodes, edges]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0d1117]">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-3 h-3 border border-[#58a6ff] border-t-transparent rounded-full animate-spin" />
          Loading architecture view...
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0d1117] text-gray-500 text-sm">
        <div className="text-center">
          <div className="text-2xl mb-2">◈</div>
          <p>No data for architecture view</p>
          <p className="text-xs mt-1 opacity-60">
            Open multiple files to see the architecture
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full bg-[#0d1117]" />
  );
}
