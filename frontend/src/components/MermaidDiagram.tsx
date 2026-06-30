import { useEffect, useState } from "react";

interface MermaidDiagramProps {
  definition: string;
}

export default function MermaidDiagram({ definition }: MermaidDiagramProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!definition) {
      setSvgContent(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setSvgContent(null);

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          theme: "dark",
          themeVariables: {
            background: "#0d1117",
            primaryColor: "#161b22",
            primaryTextColor: "#e6edf3",
            primaryBorderColor: "#30363d",
            lineColor: "#58a6ff",
            secondaryColor: "#0d1117",
            tertiaryColor: "#161b22",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "12px",
          },
          sequence: {
            showSequenceNumbers: true,
          },
        });

        const { svg } = await mermaid.render("mermaid-svg", definition);
        if (!cancelled) {
          setSvgContent(svg);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to render diagram");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [definition]);

  if (!definition) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        <div className="text-center">
          <div className="text-2xl mb-2">⬡</div>
          <p>No function selected</p>
          <p className="text-xs mt-1 opacity-60">
            Select a function in the toolbar dropdown
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto bg-[#0d1117]">
      {loading && (
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <div className="w-3 h-3 border border-[#58a6ff] border-t-transparent rounded-full animate-spin" />
            Rendering diagram...
          </div>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center h-full">
          <div className="text-red-400 text-sm text-center px-4">
            <p>Failed to render diagram</p>
            <p className="text-xs mt-1 opacity-60">{error}</p>
          </div>
        </div>
      )}
      {svgContent && !loading && (
        <div
          className="p-4"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )}
    </div>
  );
}
