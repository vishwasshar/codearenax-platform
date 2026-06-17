import {
  MonitorSmartphone,
  Server,
  Network,
  Database,
  Cpu,
  Video,
} from "lucide-react";

import GlassCard from "../ui/GlassCard";
import SectionHeading from "../ui/SectionHeading";

interface WorkflowItem {
  title: string;
  description: string;
  icon: typeof MonitorSmartphone;
  color: string;
}

const workflow: WorkflowItem[] = [
  {
    title: "React Frontend",
    description:
      "Developers interact with a Monaco Editor-based collaborative workspace.",
    icon: MonitorSmartphone,
    color: "text-cyan-400",
  },
  {
    title: "NestJS Backend",
    description:
      "Handles authentication, room management, REST APIs and Socket.IO connections.",
    icon: Server,
    color: "text-violet-400",
  },
  {
    title: "Real-Time Layer",
    description:
      "Yjs CRDT synchronizes editor changes while Socket.IO distributes updates instantly.",
    icon: Network,
    color: "text-emerald-400",
  },
  {
    title: "Database Layer",
    description:
      "MongoDB stores users, rooms, chat history and collaboration metadata.",
    icon: Database,
    color: "text-orange-400",
  },
  {
    title: "Execution Engine",
    description:
      "A dedicated Express microservice securely executes JavaScript, Python and C++ code.",
    icon: Cpu,
    color: "text-pink-400",
  },
  {
    title: "MediaSoup SFU",
    description:
      "Provides scalable voice and video communication for collaborative sessions.",
    icon: Video,
    color: "text-sky-400",
  },
];

export default function Workflow() {
  return (
    <section id="workflow" className="py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          badge="Workflow"
          title="System Workflow"
          subtitle="Understand how CodeArenaX processes collaboration, communication and code execution in real time."
        />

        <div className="grid gap-6 lg:grid-cols-6">
          {workflow.map((step, index) => {
            const Icon = step.icon;

            return (
              <div key={step.title} className="flex items-center">
                <GlassCard className="flex h-full flex-1 flex-col items-center p-6 text-center">
                  <div
                    className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 ${step.color}`}
                  >
                    <Icon size={30} />
                  </div>

                  <h3 className="mb-3 text-lg font-semibold text-white">
                    {step.title}
                  </h3>

                  <p className="text-sm leading-6 text-slate-400">
                    {step.description}
                  </p>
                </GlassCard>

                {index !== workflow.length - 1 && (
                  <div className="mx-4 hidden h-[2px] flex-1 bg-gradient-to-r from-cyan-500 to-violet-500 lg:block" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
