import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";
import type { AnalysisResult, FunctionDef, FunctionCall } from "../workers/syntax.worker";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 50;

export interface GraphNodeData {
  label: string;
  type: "function" | "call" | "import" | "file";
  lineNumber: number;
  parameters?: string[];
  args?: string[];
  fileImport?: string;
  filePath?: string;
  definitionFile?: string;
  [key: string]: unknown;
}

export type ViewMode = "call-graph" | "project-graph" | "file-tree" | "sequence-diagram" | "force-graph";

interface FileEntry {
  path: string;
  lang: string;
}

interface UseCodeGraphOptions {
  ydoc: Y.Doc | null;
  activeFile: string | null;
  files?: FileEntry[];
  viewMode: ViewMode;
  searchQuery: string;
  filterType: "all" | "function" | "file" | "import";
  depthLimit: number;
  highlightCycles: boolean;
  selectedFunction?: string;
  useElkjs?: boolean;
}

interface PerFileCache {
  codeHash: string;
  result: AnalysisResult;
}

export function useCodeGraph({
  ydoc,
  activeFile,
  files = [],
  viewMode,
  searchQuery,
  filterType,
  depthLimit,
  highlightCycles,
  selectedFunction,
}: UseCodeGraphOptions) {
  const workerRef = useRef<Worker | null>(null);
  const queueRef = useRef<{ code: string; language: string; filePath: string }[]>([]);
  const processingRef = useRef(false);
  const cacheRef = useRef<Map<string, PerFileCache>>(new Map());

  const [singleAnalysis, setSingleAnalysis] = useState<AnalysisResult | null>(null);
  const [allAnalyses, setAllAnalyses] = useState<Map<string, AnalysisResult>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/syntax.worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<AnalysisResult>) => {
      const item = queueRef.current.shift();
      if (item) {
        const hash = simpleHash(item.code);
        cacheRef.current.set(item.filePath, { codeHash: hash, result: e.data });
      }

      if (queueRef.current.length > 0) {
        const next = queueRef.current[0];
        worker.postMessage({ code: next.code, language: next.language });
      } else {
        processingRef.current = false;
        setLoading(false);
      }
    };

    worker.onerror = (err) => {
      queueRef.current.shift();
      processingRef.current = false;
      setLoading(false);
      setError(`Worker error: ${err.message}`);
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const analyzeFile = useCallback((filePath: string, code: string, language: string) => {
    const hash = simpleHash(code);
    const cached = cacheRef.current.get(filePath);
    if (cached && cached.codeHash === hash) return;

    queueRef.current.push({ code, language, filePath });

    if (!processingRef.current) {
      processingRef.current = true;
      setLoading(true);
      const worker = workerRef.current;
      if (worker) {
        const item = queueRef.current[0];
        worker.postMessage({ code: item.code, language: item.language });
      }
    }
  }, []);

  const analyzeAllFiles = useCallback(() => {
    if (!ydoc || files.length === 0) return;

    for (const file of files) {
      const yText = ydoc.getText(file.path);
      const code = yText.toString();
      if (!code.trim()) continue;

      const ext = file.path.split(".").pop()?.toLowerCase() || "";
      const lang =
        ext === "ts" || ext === "tsx" ? (ext === "tsx" ? "tsx" : "typescript")
        : ext === "jsx" ? "jsx"
        : ext === "js" || ext === "mjs" ? "javascript"
        : "javascript";

      analyzeFile(file.path, code, lang);
    }
  }, [ydoc, files, analyzeFile]);

  useEffect(() => {
    if (!ydoc || !activeFile) return;

    const yText = ydoc.getText(activeFile);

    const handleChange = () => {
      const code = yText.toString();
      const ext = activeFile.split(".").pop()?.toLowerCase() || "";
      const lang =
        ext === "ts" || ext === "tsx" ? (ext === "tsx" ? "tsx" : "typescript")
        : ext === "jsx" ? "jsx"
        : ext === "js" || ext === "mjs" ? "javascript"
        : "javascript";
      analyzeFile("__single__", code, lang);
    };

    handleChange();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const observer = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(handleChange, 300);
    };

    yText.observe(observer);
    return () => {
      yText.unobserve(observer);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [ydoc, activeFile, analyzeFile]);

  const prevFilesRef = useRef<string>("");
  useEffect(() => {
    if (viewMode === "project-graph" || viewMode === "file-tree" || viewMode === "force-graph") {
      const fileKey = files.map((f) => f.path).sort().join(",");
      if (fileKey !== prevFilesRef.current) {
        prevFilesRef.current = fileKey;
        analyzeAllFiles();
      }
    }
  }, [viewMode, files, analyzeAllFiles]);

  const analysesHashRef = useRef("");

  useEffect(() => {
    if (!processingRef.current) {
      const merged = new Map<string, AnalysisResult>();
      for (const [path, cache] of cacheRef.current.entries()) {
        if (path !== "__single__") {
          merged.set(path, cache.result);
        }
      }

      const newHash = Array.from(merged.entries())
        .map(([p, r]) => `${p}:${r.functions.length}:${r.calls.length}:${r.imports.length}:${simpleHash(JSON.stringify(r.errors))}`)
        .sort().join("|");

      if (newHash !== analysesHashRef.current) {
        analysesHashRef.current = newHash;
        setAllAnalyses(new Map(merged));
      }

      const singleCache = cacheRef.current.get("__single__");
      if (singleCache) {
        setSingleAnalysis(singleCache.result);
      }
    }
  }, [loading]);

  const graphData = useMemo(() => buildViewGraph(
    viewMode,
    singleAnalysis,
    allAnalyses,
    activeFile,
    files,
    searchQuery,
    filterType,
    depthLimit,
    highlightCycles,
    selectedFunction,
  ), [
    viewMode,
    singleAnalysis,
    allAnalyses,
    activeFile,
    files,
    searchQuery,
    filterType,
    depthLimit,
    highlightCycles,
    selectedFunction,
  ]);

  const functionsCount = singleAnalysis?.functions.length ?? 0;
  const projectFunctionsCount = Array.from(allAnalyses.values()).reduce(
    (sum, a) => sum + a.functions.length,
    0,
  );

  const singleFileFunctions = singleAnalysis?.functions.map((f) => f.name) ?? [];
  const mermaidDef = buildMermaidDef(singleAnalysis, selectedFunction || singleFileFunctions[0] || "", depthLimit);

  return {
    ...graphData,
    loading,
    error,
    singleAnalysis,
    allAnalyses,
    functionsCount,
    projectFunctionsCount,
    mermaidDef,
    availableFunctions: singleFileFunctions,
  };
}

function buildViewGraph(
  viewMode: ViewMode,
  singleAnalysis: AnalysisResult | null,
  allAnalyses: Map<string, AnalysisResult>,
  activeFile: string | null,
  files: FileEntry[],
  searchQuery: string,
  filterType: string,
  depthLimit: number,
  highlightCycles: boolean,
  _selectedFunction?: string,
): { nodes: Node<GraphNodeData>[]; edges: Edge[]; cycles: string[][] } {
  if (viewMode === "call-graph") {
    return buildSingleFileGraph(singleAnalysis, activeFile, searchQuery, filterType, depthLimit, highlightCycles);
  }
  if (viewMode === "file-tree") {
    return buildFileTreeGraph(files, allAnalyses, searchQuery, highlightCycles);
  }
  if (viewMode === "sequence-diagram") {
    return { nodes: [], edges: [], cycles: [] };
  }
  if (viewMode === "force-graph") {
    return buildProjectGraph(allAnalyses, files, activeFile, searchQuery, filterType, depthLimit, highlightCycles);
  }
  return buildProjectGraph(allAnalyses, files, activeFile, searchQuery, filterType, depthLimit, highlightCycles);
}

function buildSingleFileGraph(
  analysis: AnalysisResult | null,
  activeFile: string | null,
  searchQuery: string,
  filterType: string,
  depthLimit: number,
  highlightCycles: boolean,
) {
  if (!analysis) return { nodes: [], edges: [], cycles: [] };
  let { nodes, edges } = buildBasicGraph(analysis, activeFile || "");
  if (searchQuery) {
    nodes = filterNodesBySearch(nodes, searchQuery);
    const ids = new Set(nodes.map((n) => n.id));
    edges = edges.filter((e) => ids.has(e.source) && ids.has(e.target));
  }
  if (filterType !== "all") {
    nodes = nodes.filter((n) => n.data.type === filterType);
    const ids = new Set(nodes.map((n) => n.id));
    edges = edges.filter((e) => ids.has(e.source) && ids.has(e.target));
  }
  const cycles = highlightCycles ? detectCycles(nodes, edges) : [];
  applyDagreLayout(nodes, edges);
  return { nodes, edges, cycles };
}

function buildBasicGraph(
  analysis: AnalysisResult,
  filePath: string,
): { nodes: Node<GraphNodeData>[]; edges: Edge[] } {
  const { functions, calls, imports } = analysis;
  const nodeMap = new Map<string, Node<GraphNodeData>>();
  const edgeMap = new Map<string, Edge>();
  const addedFunctions = new Set<string>();

  functions.forEach((fn) => {
    const id = `fn-${fn.name}@${filePath}`;
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
          filePath,
        },
      });
    }
  });

  calls.forEach((call) => {
    const callId = `call-${call.name}-${call.callLine}@${filePath}`;
    if (!nodeMap.has(callId)) {
      nodeMap.set(callId, {
        id: callId,
        type: "functionNode",
        position: { x: 0, y: 0 },
        data: {
          label: call.name,
          type: "call",
          lineNumber: call.callLine,
          args: call.arguments.length > 0 ? call.arguments : undefined,
          filePath,
        },
      });
    }
  });

  imports.forEach((imp) => {
    const impId = `import-${imp.source}@${filePath}`;
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
          filePath,
        },
      });
    }
  });

  functions.forEach((fn) => {
    const fnId = `fn-${fn.name}@${filePath}`;
    calls.forEach((call) => {
      const callId = `call-${call.name}-${call.callLine}@${filePath}`;
      if (call.callLine >= fn.startLine && call.callLine <= fn.endLine) {
        const edgeId = `${fnId}->${callId}`;
        if (!edgeMap.has(edgeId)) {
          edgeMap.set(edgeId, {
            id: edgeId,
            source: fnId,
            target: callId,
            animated: true,
            label: call.arguments.length > 0 ? call.arguments.join(", ") : undefined,
            style: { stroke: "#58a6ff", strokeWidth: 1.5 },
          });
        }
      }
    });
  });

  return {
    nodes: Array.from(nodeMap.values()),
    edges: Array.from(edgeMap.values()),
  };
}

function buildProjectGraph(
  allAnalyses: Map<string, AnalysisResult>,
  files: FileEntry[],
  activeFile: string | null,
  searchQuery: string,
  filterType: string,
  depthLimit: number,
  highlightCycles: boolean,
) {
  const fileNodeMap = new Map<string, Node<GraphNodeData>>();
  const edgeMap = new Map<string, Edge>();

  const fileSet = new Set(files.map((f) => f.path));

  for (const filePath of fileSet) {
    const analysis = allAnalyses.get(filePath);
    if (!analysis) continue;

    const hasContent = analysis.functions.length > 0 || analysis.imports.length > 0;
    const shortName = filePath.split("/").pop() || filePath;

    const fileId = `file-${filePath}`;
    fileNodeMap.set(fileId, {
      id: fileId,
      type: "functionNode",
      position: { x: 0, y: 0 },
      data: {
        label: shortName,
        type: "file",
        lineNumber: 0,
        filePath,
        fileImport: hasContent
          ? `${analysis.functions.length} fn, ${analysis.imports.length} imports`
          : "empty",
      },
    });
  }

  const allDefs = new Map<string, { filePath: string; line: number }>();
  for (const [fPath, analysis] of allAnalyses) {
    if (!fileSet.has(fPath)) continue;
    for (const fn of analysis.functions) {
      allDefs.set(fn.name, { filePath: fPath, line: fn.startLine });
    }
  }

  for (const [fPath, analysis] of allAnalyses) {
    if (!fileSet.has(fPath)) continue;
    const fileId = `file-${fPath}`;

    for (const call of analysis.calls) {
      const def = allDefs.get(call.name);
      if (def && def.filePath !== fPath) {
        const targetId = `file-${def.filePath}`;
        if (fileNodeMap.has(targetId)) {
          const edgeId = `cross-${fPath}->${def.filePath}-${call.name}`;
          if (!edgeMap.has(edgeId)) {
            edgeMap.set(edgeId, {
              id: edgeId,
              source: fileId,
              target: targetId,
              label: call.name,
              animated: true,
              style: { stroke: "#f0883e", strokeWidth: 1.5 },
            });
          }
        }
      }
    }

    for (const imp of analysis.imports) {
      const impPath = resolveImportPath(fPath, imp.source);
      if (impPath && fileSet.has(impPath)) {
        const targetId = `file-${impPath}`;
        if (fileNodeMap.has(targetId)) {
          const edgeId = `import-${fPath}->${impPath}`;
          if (!edgeMap.has(edgeId)) {
            edgeMap.set(edgeId, {
              id: edgeId,
              source: fileId,
              target: targetId,
              style: { stroke: "#30363d", strokeWidth: 1, strokeDasharray: "4 2" },
            });
          }
        }
      }
    }
  }

  let nodes = Array.from(fileNodeMap.values());
  let edges = Array.from(edgeMap.values());

  if (activeFile && depthLimit > 0) {
    const result = applyDepthLimit(nodes, edges, `file-${activeFile}`, depthLimit);
    nodes = result.nodes;
    edges = result.edges;
  }

  if (searchQuery) {
    nodes = filterNodesBySearch(nodes, searchQuery);
    const ids = new Set(nodes.map((n) => n.id));
    edges = edges.filter((e) => ids.has(e.source) && ids.has(e.target));
  }

  if (filterType !== "all" && filterType === "file") {
  } else if (filterType !== "all") {
    nodes = nodes.filter((n) => n.data.type === filterType);
    const ids = new Set(nodes.map((n) => n.id));
    edges = edges.filter((e) => ids.has(e.source) && ids.has(e.target));
  }

  const cycles = highlightCycles ? detectCycles(nodes, edges) : [];

  if (cycles.length > 0) {
    const cycleNodeIds = new Set(cycles.flat());
    edges = edges.map((e) => {
      if (cycleNodeIds.has(e.source) && cycleNodeIds.has(e.target)) {
        return { ...e, style: { ...e.style, stroke: "#da3633", strokeWidth: 2 } };
      }
      return e;
    });
  }

  applyDagreLayout(nodes, edges);
  return { nodes, edges, cycles };
}

function buildFileTreeGraph(
  files: FileEntry[],
  allAnalyses: Map<string, AnalysisResult>,
  searchQuery: string,
  highlightCycles: boolean,
) {
  const nodeMap = new Map<string, Node<GraphNodeData>>();
  const edgeMap = new Map<string, Edge>();

  const dirNodes = new Set<string>();

  for (const file of files) {
    const parts = file.path.split("/");
    for (let i = 0; i < parts.length; i++) {
      const prefix = parts.slice(0, i + 1).join("/");
      const isFile = i === parts.length - 1;
      if (!isFile && !dirNodes.has(prefix)) {
        dirNodes.add(prefix);
        nodeMap.set(`dir-${prefix}`, {
          id: `dir-${prefix}`,
          type: "functionNode",
          position: { x: 0, y: 0 },
          data: {
            label: parts[i],
            type: "import",
            lineNumber: 0,
            filePath: prefix,
          },
        });
        if (i > 0) {
          const parent = parts.slice(0, i).join("/");
          const parentId = `dir-${parent}`;
          if (nodeMap.has(parentId)) {
            edgeMap.set(`tree-${parent}->${prefix}`, {
              id: `tree-${parent}->${prefix}`,
              source: parentId,
              target: `dir-${prefix}`,
              style: { stroke: "#30363d", strokeWidth: 1 },
            });
          }
        }
      }
    }

    const fileId = `file-${file.path}`;
    const analysis = allAnalyses.get(file.path);
    const fnCount = analysis?.functions.length ?? 0;

    nodeMap.set(fileId, {
      id: fileId,
      type: "functionNode",
      position: { x: 0, y: 0 },
      data: {
        label: parts[parts.length - 1],
        type: "file",
        lineNumber: 0,
        filePath: file.path,
        fileImport: fnCount > 0 ? `${fnCount} fn` : "",
      },
    });

    const parentDir = parts.slice(0, -1).join("/");
    if (parentDir) {
      edgeMap.set(`tree-${parentDir}->${file.path}`, {
        id: `tree-${parentDir}->${file.path}`,
        source: `dir-${parentDir}`,
        target: fileId,
        style: { stroke: "#30363d", strokeWidth: 1 },
      });
    }
  }

  let nodes = Array.from(nodeMap.values());
  let edges = Array.from(edgeMap.values());

  if (searchQuery) {
    nodes = filterNodesBySearch(nodes, searchQuery);
    const ids = new Set(nodes.map((n) => n.id));
    edges = edges.filter((e) => ids.has(e.source) && ids.has(e.target));
  }

  const cycles: string[][] = [];
  applyDagreLayout(nodes, edges);
  return { nodes, edges, cycles };
}

function resolveImportPath(currentFile: string, importSource: string): string | null {
  if (!importSource.startsWith(".") && !importSource.startsWith("/")) return null;

  const dir = currentFile.includes("/") ? currentFile.substring(0, currentFile.lastIndexOf("/")) : "";
  const resolved = importSource.startsWith("/")
    ? importSource.slice(1)
    : dir
      ? resolveRelativePath(dir, importSource)
      : importSource;

  const candidates = [resolved, `${resolved}.ts`, `${resolved}.tsx`, `${resolved}.js`, `${resolved}/index.ts`, `${resolved}/index.tsx`, `${resolved}/index.js`];

  for (const c of candidates) {
    const normalized = c.replace(/^\/+/, "");
    if (normalized) return normalized;
  }
  return null;
}

function resolveRelativePath(dir: string, relative: string): string {
  const dirParts = dir.split("/");
  const relParts = relative.split("/");
  for (const part of relParts) {
    if (part === ".") continue;
    if (part === "..") dirParts.pop();
    else dirParts.push(part);
  }
  return dirParts.join("/");
}

function applyDepthLimit(
  nodes: Node<GraphNodeData>[],
  edges: Edge[],
  rootId: string,
  depth: number,
) {
  if (depth <= 0) return { nodes, edges };

  const adj = new Map<string, string[]>();
  for (const e of edges) {
    if (!adj.has(e.source)) adj.set(e.source, []);
    adj.get(e.source)!.push(e.target);
    if (!adj.has(e.target)) adj.set(e.target, []);
    adj.get(e.target)!.push(e.source);
  }

  const visited = new Set<string>();
  const queue: [string, number][] = [[rootId, 0]];
  visited.add(rootId);

  while (queue.length > 0) {
    const [current, d] = queue.shift()!;
    if (d >= depth) continue;
    for (const neighbor of adj.get(current) || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, d + 1]);
      }
    }
  }

  const idSet = new Set(nodes.map((n) => n.id));
  const validIds = new Set([...visited].filter((id) => idSet.has(id)));

  return {
    nodes: nodes.filter((n) => validIds.has(n.id)),
    edges: edges.filter((e) => validIds.has(e.source) && validIds.has(e.target)),
  };
}

function detectCycles(nodes: Node<GraphNodeData>[], edges: Edge[]): string[][] {
  const adj = new Map<string, string[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) {
    adj.get(e.source)?.push(e.target);
  }

  const visited = new Set<string>();
  const recStack = new Set<string>();
  const cycles: string[][] = [];
  const parentMap = new Map<string, string>();

  function dfs(node: string) {
    visited.add(node);
    recStack.add(node);

    for (const neighbor of adj.get(node) || []) {
      if (!visited.has(neighbor)) {
        parentMap.set(neighbor, node);
        dfs(neighbor);
      } else if (recStack.has(neighbor)) {
        const cycle: string[] = [neighbor];
        let cur = node;
        while (cur !== neighbor) {
          cycle.unshift(cur);
          cur = parentMap.get(cur) || "";
          if (!cur) break;
        }
        cycle.unshift(neighbor);
        if (cycle.length > 2) cycles.push(cycle);
      }
    }

    recStack.delete(node);
  }

  for (const n of nodes) {
    if (!visited.has(n.id)) dfs(n.id);
  }

  return cycles;
}

function filterNodesBySearch(nodes: Node<GraphNodeData>[], query: string) {
  const q = query.toLowerCase();
  return nodes.filter((n) => n.data.label.toLowerCase().includes(q));
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

function buildGraphData(analysis: AnalysisResult | null, activeFile: string | null): {
  nodes: Node<GraphNodeData>[];
  edges: Edge[];
} {
  if (!analysis) return { nodes: [], edges: [] };
  const { nodes, edges } = buildBasicGraph(analysis, activeFile || "");
  if (nodes.length > 0) applyDagreLayout(nodes, edges);
  return { nodes, edges };
}

function applyDagreLayout(nodes: Node[], edges: Edge[]) {
  if (nodes.length === 0) return;
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

interface CallNode {
  name: string;
  children: CallNode[];
}

function buildCallTree(
  fnName: string,
  functions: FunctionDef[],
  calls: FunctionCall[],
  depth: number,
  visited: Set<string> = new Set(),
): CallNode | null {
  if (depth <= 0) return null;
  const fn = functions.find((f) => f.name === fnName);
  if (!fn) return { name: fnName, children: [] };
  if (visited.has(fnName)) return { name: fnName, children: [] };
  visited.add(fnName);

  const children: CallNode[] = [];

  calls
    .filter((c) => c.callLine >= fn.startLine && c.callLine <= fn.endLine)
    .forEach((c) => {
      const child = buildCallTree(c.name, functions, calls, depth - 1, visited);
      if (child) children.push(child);
    });

  visited.delete(fnName);
  return { name: fnName, children };
}

function buildMermaidDef(
  analysis: AnalysisResult | null,
  selectedFunction: string,
  depth: number,
): string {
  if (!analysis || !selectedFunction) return "";

  const tree = buildCallTree(selectedFunction, analysis.functions, analysis.calls, depth);
  if (!tree) return "";

  const participants = new Set<string>();
  const collect = (node: CallNode) => {
    participants.add(node.name);
    for (const c of node.children) collect(c);
  };
  collect(tree);

  let def = "sequenceDiagram\n    autonumber\n";
  for (const p of participants) {
    def += `    participant ${p}\n`;
  }
  def += "\n";

  function addMessages(node: CallNode) {
    for (const child of node.children) {
      def += `    ${node.name}->>+${child.name}: \n`;
      addMessages(child);
      def += `    ${child.name}-->>-${node.name}: \n`;
    }
  }

  addMessages(tree);
  return def;
}

export { buildGraphData };
