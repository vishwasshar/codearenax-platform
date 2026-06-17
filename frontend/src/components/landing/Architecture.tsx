import {
  Database,
  Server,
  MonitorSmartphone,
  ShieldCheck,
  Cpu,
  Network,
  Code2,
  Video,
} from "lucide-react";

import SectionHeading from "../ui/SectionHeading";
import GlassCard from "../ui/GlassCard";

const architecture = [
  {
    title: "Frontend",
    icon: MonitorSmartphone,
    color: "text-cyan-400",
    items: [
      "React",
      "TypeScript",
      "Monaco Editor",
      "Yjs CRDT",
      "Socket.IO Client",
      "MediaSoup Client",
    ],
  },
  {
    title: "Backend",
    icon: Server,
    color: "text-violet-400",
    items: [
      "NestJS",
      "REST APIs",
      "Socket.IO Gateway",
      "JWT Authentication",
      "Google OAuth",
    ],
  },
  {
    title: "Realtime Layer",
    icon: Network,
    color: "text-green-400",
    items: [
      "Socket.IO",
      "Yjs Synchronization",
      "MediaSoup SFU",
      "Redis Pub/Sub",
    ],
  },
  {
    title: "Execution Engine",
    icon: Cpu,
    color: "text-orange-400",
    items: [
      "Express Microservice",
      "JavaScript",
      "Python",
      "C++",
      "Docker Sandbox",
    ],
  },
  {
    title: "Database",
    icon: Database,
    color: "text-pink-400",
    items: ["MongoDB", "Room Data", "Messages", "Users"],
  },
  {
    title: "Security",
    icon: ShieldCheck,
    color: "text-emerald-400",
    items: ["JWT", "OAuth", "Protected Routes", "Room Authorization"],
  },
];

export default function Architecture() {
  return (
    <section id="architecture" className="relative overflow-hidden py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          badge="Architecture"
          title="Designed for Real-Time Collaboration"
          subtitle="CodeArenaX combines distributed synchronization, secure authentication, low-latency communication, and isolated code execution into a scalable developer platform."
        />

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {architecture.map((module) => {
            const Icon = module.icon;

            return (
              <GlassCard key={module.title} className="p-7">
                <div className="mb-5 flex items-center gap-4">
                  <div
                    className={`rounded-xl bg-slate-900 p-3 ${module.color}`}
                  >
                    <Icon size={26} />
                  </div>

                  <h3 className="text-xl font-semibold text-white">
                    {module.title}
                  </h3>
                </div>

                <ul className="space-y-3">
                  {module.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-slate-300"
                    >
                      <Code2 size={15} className="text-cyan-400" />

                      {item}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            );
          })}
        </div>

        <div className="mt-24">
          <GlassCard className="p-10">
            <h3 className="mb-10 text-center text-3xl font-bold text-white">
              System Workflow
            </h3>

            <div className="flex flex-wrap items-center justify-center gap-6">
              {[
                {
                  icon: MonitorSmartphone,
                  title: "Frontend",
                },
                {
                  icon: Server,
                  title: "Backend",
                },
                {
                  icon: Database,
                  title: "MongoDB",
                },
                {
                  icon: Cpu,
                  title: "Execution",
                },
                {
                  icon: Video,
                  title: "MediaSoup",
                },
              ].map((step, index) => {
                const Icon = step.icon;

                return (
                  <div key={step.title} className="flex items-center gap-6">
                    <div className="flex flex-col items-center">
                      <div className="rounded-2xl border border-cyan-500/30 bg-slate-900 p-5">
                        <Icon size={34} className="text-cyan-400" />
                      </div>

                      <p className="mt-3 font-medium text-slate-300">
                        {step.title}
                      </p>
                    </div>

                    {index !== 4 && (
                      <div className="hidden h-[2px] w-16 bg-cyan-500 md:block" />
                    )}
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
