import EditorWindow from "./EditorWindow";
import Terminal from "./Terminal";

export default function HeroCodePreview() {
  return (
    <div className="relative w-full max-w-3xl">
      {/* Glow */}

      <div className="absolute -inset-6 rounded-[40px] bg-cyan-500/10 blur-3xl" />

      {/* Window */}

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl">
        {/* Window Header */}

        <div className="flex items-center justify-between border-b border-white/10 bg-slate-900 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />

            <div className="h-3 w-3 rounded-full bg-yellow-500" />

            <div className="h-3 w-3 rounded-full bg-green-500" />
          </div>

          <span className="text-sm text-slate-400">CodeArenaX</span>

          <div className="w-16" />
        </div>

        {/* Editor */}

        <EditorWindow />

        {/* Terminal */}

        <Terminal />
      </div>
    </div>
  );
}
