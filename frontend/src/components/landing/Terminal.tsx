import { CheckCircle2, TerminalSquare, Play, Clock3 } from "lucide-react";

const terminalLines = [
  {
    type: "command",
    text: "$ npm run dev",
  },
  {
    type: "info",
    text: "Starting CodeArenaX Development Server...",
  },
  {
    type: "success",
    text: "Socket.IO Gateway initialized",
  },
  {
    type: "success",
    text: "MediaSoup Router created",
  },
  {
    type: "success",
    text: "MongoDB Connected",
  },
  {
    type: "success",
    text: "Redis Connected",
  },
  {
    type: "success",
    text: "Execution Service Ready",
  },
];

export default function Terminal() {
  return (
    <div className="border-t border-white/10 bg-[#0a0f1a]">
      {/* Header */}

      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-2">
          <TerminalSquare size={18} className="text-cyan-400" />

          <span className="text-sm font-medium text-white">Terminal</span>
        </div>

        <button className="flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400">
          <Play size={15} />
          Run
        </button>
      </div>

      {/* Output */}

      <div className="space-y-2 p-5 font-mono text-sm">
        {terminalLines.map((line, index) => {
          const color =
            line.type === "command"
              ? "text-cyan-400"
              : line.type === "success"
                ? "text-emerald-400"
                : "text-slate-400";

          return (
            <div key={index} className={`flex items-center gap-3 ${color}`}>
              {line.type === "success" ? (
                <CheckCircle2 size={15} />
              ) : (
                <span className="text-slate-500">$</span>
              )}

              <span>{line.text}</span>
            </div>
          );
        })}

        {/* Current Execution */}

        <div className="mt-5 flex items-center justify-between rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <Clock3 size={18} className="text-cyan-400" />

            <div>
              <p className="text-sm font-medium text-white">Last Execution</p>

              <p className="text-xs text-slate-400">JavaScript • Success</p>
            </div>
          </div>

          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
            48 ms
          </span>
        </div>
      </div>
    </div>
  );
}
