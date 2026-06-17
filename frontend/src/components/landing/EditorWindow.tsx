import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  Folder,
  Search,
  GitBranch,
  Bug,
  Blocks,
} from "lucide-react";

const code = [
  {
    line: 1,
    html: `<span class="text-sky-400">import</span> <span class="text-white">{ Server }</span> <span class="text-sky-400">from</span> <span class="text-emerald-400">'@nestjs/common'</span>;`,
  },
  {
    line: 2,
    html: `<span class="text-sky-400">import</span> <span class="text-white">{ WebSocketGateway }</span> <span class="text-sky-400">from</span> <span class="text-emerald-400">'@nestjs/websockets'</span>;`,
  },
  {
    line: 3,
    html: "",
  },
  {
    line: 4,
    html: `<span class="text-violet-400">@WebSocketGateway()</span>`,
  },
  {
    line: 5,
    html: `<span class="text-sky-400">export</span> <span class="text-sky-400">class</span> <span class="text-yellow-300">RoomGateway</span> {`,
  },
  {
    line: 6,
    html: `&nbsp;&nbsp;<span class="text-cyan-400">constructor</span>() {}`,
  },
  {
    line: 7,
    html: "",
  },
  {
    line: 8,
    html: `&nbsp;&nbsp;<span class="text-cyan-400">joinRoom</span>(roomId: <span class="text-orange-300">string</span>) {`,
  },
  {
    line: 9,
    html: `&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-sky-400">return</span> <span class="text-yellow-300">socket</span>.emit(<span class="text-emerald-400">'join-room'</span>);`,
  },
  {
    line: 10,
    html: `&nbsp;&nbsp;}`,
  },
  {
    line: 11,
    html: `}`,
  },
];

export default function EditorWindow() {
  return (
    <div className="flex h-[480px]">
      {/* Explorer */}

      <aside className="hidden w-64 border-r border-white/10 bg-slate-950 lg:block">
        {/* Sidebar */}

        <div className="flex justify-around border-b border-white/10 py-4">
          <FileCode2 size={18} className="text-cyan-400" />

          <Search size={18} className="text-slate-500" />

          <GitBranch size={18} className="text-slate-500" />

          <Bug size={18} className="text-slate-500" />

          <Blocks size={18} className="text-slate-500" />
        </div>

        {/* Explorer */}

        <div className="p-4">
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Explorer
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <ChevronDown size={16} />

            <Folder size={17} className="text-cyan-400" />

            <span>CodeArenaX</span>
          </div>

          <div className="ml-6 mt-3 space-y-2">
            <div className="flex items-center gap-2 text-slate-400">
              <ChevronRight size={14} />
              <Folder size={16} className="text-yellow-400" />
              src
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <ChevronRight size={14} />
              <Folder size={16} className="text-yellow-400" />
              components
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <ChevronRight size={14} />
              <Folder size={16} className="text-yellow-400" />
              services
            </div>

            <div className="flex items-center gap-2 text-cyan-400">
              <FileCode2 size={16} />
              room.gateway.ts
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <FileCode2 size={16} />
              editor.tsx
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <FileCode2 size={16} />
              socket.ts
            </div>
          </div>
        </div>
      </aside>

      {/* Editor */}

      <div className="flex flex-1 flex-col">
        {/* Tabs */}

        <div className="flex border-b border-white/10 bg-slate-900">
          <div className="flex items-center gap-2 border-r border-white/10 bg-slate-950 px-5 py-3">
            <FileCode2 size={16} className="text-cyan-400" />

            <span className="text-sm text-white">room.gateway.ts</span>
          </div>

          <div className="flex items-center gap-2 border-r border-white/10 px-5 py-3">
            <FileCode2 size={16} className="text-slate-500" />

            <span className="text-sm text-slate-500">editor.tsx</span>
          </div>

          <div className="flex items-center gap-2 px-5 py-3">
            <FileCode2 size={16} className="text-slate-500" />

            <span className="text-sm text-slate-500">socket.ts</span>
          </div>
        </div>

        {/* Code */}

        <div className="flex-1 overflow-auto bg-[#0d1117] font-mono text-sm">
          {code.map((line) => (
            <div key={line.line} className="flex hover:bg-white/[0.03]">
              <div className="w-14 select-none border-r border-white/5 py-1 pr-4 text-right text-slate-600">
                {line.line}
              </div>

              <div
                className="flex-1 px-4 py-1 whitespace-pre"
                dangerouslySetInnerHTML={{
                  __html: line.html,
                }}
              />
            </div>
          ))}
        </div>

        {/* Status Bar */}

        <div className="flex items-center justify-between border-t border-white/10 bg-sky-700 px-4 py-2 text-xs text-white">
          <div className="flex items-center gap-5">
            <span>main*</span>

            <span>TypeScript</span>

            <span>UTF-8</span>

            <span>LF</span>
          </div>

          <div className="flex items-center gap-5">
            <span>Spaces: 2</span>

            <span>Ln 11, Col 2</span>

            <span>Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
