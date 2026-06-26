import { type OnMount } from "@monaco-editor/react";
import Editor from "@monaco-editor/react";
import { Link, useParams } from "react-router-dom";
import { useCodeReplay } from "../hooks/useCodeReplay";
import { FaLongArrowAltLeft, FaPlay, FaPause, FaUndo } from "react-icons/fa";
import { useState } from "react";

const CodeReplay = () => {
  const [editorKey, setEditorKey] = useState(0);
  const { roomId } = useParams();
  const {
    texts,
    lang,
    isPlaying,
    isFinished,
    currentIndex,
    total,
    loading,
    speed,
    play,
    pause,
    reset: hookReset,
    setSpeed,
    onUpdateRef,
  } = useCodeReplay(roomId || "");

  const reset = () => {
    hookReset();
    setEditorKey((k) => k + 1);
  };

  const handleEditorMount: OnMount = (editor) => {
    const model = editor.getModel();
    if (!model) return;

    const initialText = texts[currentIndex] || texts[0] || "";
    model.setValue(initialText);

    onUpdateRef.current = (text: string) => {
      if (text !== model.getValue()) {
        model.setValue(text);
      }
    };
  };

  const progress = total > 0 ? Math.round((currentIndex / total) * 100) : 0;

  return (
    <div className="w-full h-screen flex flex-col bg-base-300">
      <div className="flex items-center h-fit px-2 py-1 gap-4 bg-base-200 border-b border-base-content/10">
        <Link to={`/room/${roomId}`} className="btn btn-sm">
          <FaLongArrowAltLeft /> Back to Editor
        </Link>
        <span className="font-bold text-sm">Code Replay</span>

        <div className="ms-auto flex items-center gap-3">
          {!isPlaying ? (
            <button
              className="btn btn-sm bg-primary/80"
              onClick={play}
              disabled={loading || total === 0 || isFinished}
            >
              <FaPlay /> {isFinished ? "Replay" : "Play"}
            </button>
          ) : (
            <button className="btn btn-sm bg-warning/80" onClick={pause}>
              <FaPause /> Pause
            </button>
          )}
          <button
            className="btn btn-sm"
            onClick={reset}
            disabled={currentIndex === 0 && !isFinished}
          >
            <FaUndo /> Reset
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs">Speed:</span>
            <select
              className="select select-ghost select-xs w-20"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              <option value={1}>1x</option>
              <option value={5}>5x</option>
              <option value={10}>10x</option>
              <option value={50}>50x</option>
              <option value={100}>100x</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <h2 className="text-2xl">Loading replay data...</h2>
        </div>
      ) : total === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <h2 className="text-2xl">No edits recorded for this session</h2>
        </div>
      ) : (
        <Editor
          key={editorKey}
          className="flex-1"
          language={lang}
          theme="vs-dark"
          onMount={handleEditorMount}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 14,
          }}
        />
      )}

      <div className="flex items-center gap-3 px-4 py-2 bg-base-200 border-t border-base-content/10 text-sm">
        <div className="flex-1 h-2 bg-base-300 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-150 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs tabular-nums whitespace-nowrap">
          {currentIndex} / {total} edits
        </span>
      </div>
    </div>
  );
};

export default CodeReplay;
