import { useEffect, useState } from "react";
import type { editor } from "monaco-editor";

const CodeVitals = ({
  editorInstance,
}: {
  editorInstance: editor.IStandaloneCodeEditor | null;
}) => {
  const [stats, setStats] = useState({
    lines: 0,
    chars: 0,
    words: 0,
  });

  useEffect(() => {
    if (!editorInstance) return;

    const update = () => {
      const model = editorInstance.getModel();
      if (!model) return;
      const value = model.getValue();
      setStats({
        lines: model.getLineCount(),
        chars: value.length,
        words: value.trim() ? value.trim().split(/\s+/).length : 0,
      });
    };

    update();
    const disposable = editorInstance.onDidChangeModelContent(update);
    return () => disposable.dispose();
  }, [editorInstance]);

  return (
    <div className="px-3 py-2">
      <h4 className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase mb-2">
        Code Vitals
      </h4>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#161b22] rounded px-2 py-1.5 text-center">
          <div className="text-xs font-bold text-gray-200">{stats.lines}</div>
          <div className="text-[9px] text-gray-500">Lines</div>
        </div>
        <div className="bg-[#161b22] rounded px-2 py-1.5 text-center">
          <div className="text-xs font-bold text-gray-200">{stats.chars}</div>
          <div className="text-[9px] text-gray-500">Chars</div>
        </div>
        <div className="bg-[#161b22] rounded px-2 py-1.5 text-center">
          <div className="text-xs font-bold text-gray-200">{stats.words}</div>
          <div className="text-[9px] text-gray-500">Words</div>
        </div>
      </div>
    </div>
  );
};

export default CodeVitals;
