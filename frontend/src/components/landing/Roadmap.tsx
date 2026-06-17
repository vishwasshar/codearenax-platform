import {
  CheckCircle2,
  Circle,
  Rocket,
  BrainCircuit,
  BarChart3,
  Sparkles,
} from "lucide-react";

import GlassCard from "../ui/GlassCard";
import SectionHeading from "../ui/SectionHeading";

interface RoadmapItem {
  phase: string;
  title: string;
  description: string;
  status: "completed" | "progress" | "planned";
}

const roadmap: RoadmapItem[] = [
  {
    phase: "Phase 1",
    title: "Core Collaboration Platform",
    description:
      "Built authentication, room management, Monaco Editor integration and real-time collaborative editing using Yjs CRDT.",
    status: "completed",
  },
  {
    phase: "Phase 2",
    title: "Communication & Execution",
    description:
      "Integrated chat, MediaSoup voice/video communication and multi-language code execution for JavaScript, Python and C++.",
    status: "completed",
  },
  {
    phase: "Phase 3",
    title: "Scalability",
    description:
      "Improved architecture with Redis support, optimized Socket.IO communication and enhanced system performance.",
    status: "progress",
  },
  {
    phase: "Phase 4",
    title: "Analytics Dashboard",
    description:
      "Developer dashboard with collaboration analytics, room insights and activity history.",
    status: "planned",
  },
  {
    phase: "Phase 5",
    title: "AI Developer Assistant",
    description:
      "AI code review, automated bug detection, code explanation and intelligent collaboration assistance.",
    status: "planned",
  },
];

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    badge: "Completed",
    badgeClass:
      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  },
  progress: {
    icon: Rocket,
    color: "text-cyan-400",
    badge: "In Progress",
    badgeClass: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
  },
  planned: {
    icon: Circle,
    color: "text-slate-400",
    badge: "Planned",
    badgeClass: "bg-slate-500/10 text-slate-300 border border-white/10",
  },
};

export default function Roadmap() {
  return (
    <section id="roadmap" className="py-28">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          badge="Roadmap"
          title="Project Evolution"
          subtitle="The journey of CodeArenaX from a collaborative coding platform to an intelligent developer ecosystem."
        />

        <div className="relative">
          <div className="absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-cyan-500 via-violet-500 to-transparent md:block" />

          <div className="space-y-10">
            {roadmap.map((item) => {
              const config = statusConfig[item.status];
              const Icon = config.icon;

              return (
                <div key={item.phase} className="relative flex gap-6">
                  <div className="relative z-10 hidden h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-slate-900 md:flex">
                    <Icon className={config.color} size={24} />
                  </div>

                  <GlassCard className="flex-1 p-7">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-cyan-400">
                          {item.phase}
                        </p>

                        <h3 className="mt-2 text-2xl font-bold text-white">
                          {item.title}
                        </h3>
                      </div>

                      <span
                        className={`rounded-full px-4 py-2 text-sm font-medium ${config.badgeClass}`}
                      >
                        {config.badge}
                      </span>
                    </div>

                    <p className="leading-7 text-slate-400">
                      {item.description}
                    </p>
                  </GlassCard>
                </div>
              );
            })}
          </div>
        </div>

        {/* Future Vision */}

        <div className="mt-20">
          <GlassCard className="p-10">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex gap-5">
                <BrainCircuit size={34} className="text-cyan-400" />

                <BarChart3 size={34} className="text-violet-400" />

                <Sparkles size={34} className="text-amber-400" />
              </div>

              <h3 className="text-3xl font-bold text-white">Vision</h3>

              <p className="mt-6 max-w-3xl leading-8 text-slate-400">
                CodeArenaX aims to become a complete collaborative development
                platform by combining distributed synchronization, secure cloud
                execution, real-time communication and AI-powered developer
                assistance into one seamless workspace.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
