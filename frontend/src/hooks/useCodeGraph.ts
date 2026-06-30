import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";
import type { AnalysisResult } from "../workers/syntax.worker";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 50;

export interface GraphNodeData {
  label: string;
  type: "function" | "call" | "import";
  lineNumber: number;
  parameters?: string[];
  fileImport?: string;
  [key: string]: unknown;
}

export function useCodeGraph(ydoc: Y.Doc | null, activeFile: string | null) {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<number>(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/syntax.worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<AnalysisResult>) => {
      pendingRef.current--;
      if (pendingRef.current <= 0) setLoading(false);
      setAnalysis(e.data);
      if (e.data.errors?.length) {
        setError(e.data.errors.join("; "));
      } else {
        setError(null);
      }
    };

    worker.onerror = (err) => {
      pendingRef.current--;
      setLoading(false);
      setError(`Worker error: ${err.message}`);
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const analyze = useCallback((code: string, language: string) => {
    const worker = workerRef.current;
    if (!worker) return;

    pendingRef.current++;
    setLoading(true);
    worker.postMessage({ code, language });
  }, []);

  useEffect(() => {
    if (!ydoc || !activeFile) return;

    const yText = ydoc.getText(activeFile);

    const handleChange = () => {
      const code = yText.toString();
      const ext = activeFile.split(".").pop()?.toLowerCase() || "";
      const lang =
        ext === "ts" || ext === "tsx"
          ? ext === "tsx" ? "tsx" : "typescript"
          : ext === "jsx" ? "jsx"
          : ext === "js" || ext === "mjs" ? "javascript"
          : "javascript";
      analyze(code, lang);
    };

    handleChange();

    const debounceTimer = { current: null as ReturnType<typeof setTimeout> | null };
    const observer = () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(handleChange, 300);
    };

    yText.observe(observer);

    return () => {
      yText.unobserve(observer);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [ydoc, activeFile, analyze]);

  const graphData = buildGraphData(analysis);

  return { ...graphData, loading, error, analysis };
}

function buildGraphData(analysis: AnalysisResult | null): {
  nodes: Node<GraphNodeData>[];
  edges: Edge[];
} {
  if (!analysis) return { nodes: [], edges: [] };

  const { functions, calls, imports } = analysis;
  const nodeMap = new Map<string, Node<GraphNodeData>>();
  const edgeMap = new Map<string, Edge>();
  const addedFunctions = new Set<string>();

  functions.forEach((fn) => {
    const id = `fn-${fn.name}`;
    if (!addedFunctions.has(id)) {
      addedFunctions.add(id);
      nodeMap.set(id, {
        id,
        type: "functionNode",
        position: { x: 0, y: 0 },
        data: {
          label: fn.name,
          type: "function",
          lineNumber: fn.startLine,
          parameters: fn.parameters,
        },
      });
    }
  });

  calls.forEach((call) => {
    const callId = `call-${call.name}-${call.callLine}`;
    if (!nodeMap.has(callId)) {
      nodeMap.set(callId, {
        id: callId,
        type: "functionNode",
        position: { x: 0, y: 0 },
        data: {
          label: call.name,
          type: "call",
          lineNumber: call.callLine,
        },
      });
    }
  });

  imports.forEach((imp) => {
    const impId = `import-${imp.source}`;
    if (!nodeMap.has(impId)) {
      nodeMap.set(impId, {
        id: impId,
        type: "functionNode",
        position: { x: 0, y: 0 },
        data: {
          label: imp.source.split("/").pop() || imp.source,
          type: "import",
          lineNumber: imp.startLine,
          fileImport: imp.source,
        },
      });
    }
  });

  functions.forEach((fn) => {
    const fnId = `fn-${fn.name}`;
    calls.forEach((call) => {
      const callId = `call-${call.name}-${call.callLine}`;
      if (call.callLine >= fn.startLine && call.callLine <= fn.endLine) {
        const edgeId = `${fnId}->${callId}`;
        if (!edgeMap.has(edgeId)) {
          edgeMap.set(edgeId, {
            id: edgeId,
            source: fnId,
            target: callId,
            animated: true,
            style: { stroke: "#58a6ff", strokeWidth: 1.5 },
          });
        }
      }
    });
  });

  const allNodes = Array.from(nodeMap.values());
  const allEdges = Array.from(edgeMap.values());

  if (allNodes.length > 0) {
    applyDagreLayout(allNodes, allEdges);
  }

  return { nodes: allNodes, edges: allEdges };
}

function applyDagreLayout(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "LR",
    nodesep: 40,
    ranksep: 80,
    marginx: 30,
    marginy: 30,
  });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  nodes.forEach((node) => {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      node.position = {
        x: dagreNode.x - NODE_WIDTH / 2,
        y: dagreNode.y - NODE_HEIGHT / 2,
      };
    }
  });
}
