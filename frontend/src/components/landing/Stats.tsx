import { Code2, Users, Video, Cpu, Database, ShieldCheck } from "lucide-react";

import GlassCard from "../ui/GlassCard";
import SectionHeading from "../ui/SectionHeading";

const stats = [
  {
    icon: Code2,
    value: "3+",
    label: "Languages Supported",
    description: "JavaScript • Python • C++",
    color: "text-cyan-400",
  },
  {
    icon: Users,
    value: "∞",
    label: "Real-Time Collaboration",
    description: "CRDT Powered Synchronization",
    color: "text-violet-400",
  },
  {
    icon: Video,
    value: "SFU",
    label: "MediaSoup Communication",
    description: "Voice & Video Calls",
    color: "text-emerald-400",
  },
  {
    icon: Cpu,
    value: "100%",
    label: "Isolated Execution",
    description: "Secure Code Sandbox",
    color: "text-orange-400",
  },
  {
    icon: Database,
    value: "8+",
    label: "Core Technologies",
    description: "React • NestJS • MongoDB • Redis",
    color: "text-pink-400",
  },
  {
    icon: ShieldCheck,
    value: "JWT",
    label: "Secure Authentication",
    description: "JWT + Google OAuth",
    color: "text-sky-400",
  },
];

export default function Stats() {
  return (
    <section id="stats" className="py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          badge="Highlights"
          title="Built for Modern Collaborative Development"
          subtitle="CodeArenaX integrates real-time collaboration, secure code execution and developer communication into a unified platform."
        />

        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <GlassCard key={item.label} className="group p-8 text-center">
                <div
                  className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 ${item.color}`}
                >
                  <Icon
                    size={30}
                    className="transition duration-300 group-hover:scale-110"
                  />
                </div>

                <h2 className="text-5xl font-bold text-white">{item.value}</h2>

                <h3 className="mt-3 text-xl font-semibold text-white">
                  {item.label}
                </h3>

                <p className="mt-3 text-slate-400 leading-7">
                  {item.description}
                </p>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
