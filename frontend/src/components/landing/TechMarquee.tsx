import {
  Atom,
  Database,
  Server,
  Workflow,
  Code2,
  ShieldCheck,
  Boxes,
  Cpu,
  Video,
} from "lucide-react";

import SectionHeading from "../ui/SectionHeading";

const technologies = [
  {
    name: "React",
    icon: Atom,
    color: "text-sky-400",
  },
  {
    name: "TypeScript",
    icon: Code2,
    color: "text-blue-500",
  },
  {
    name: "NestJS",
    icon: Server,
    color: "text-red-500",
  },
  {
    name: "MongoDB",
    icon: Database,
    color: "text-green-500",
  },
  {
    name: "Socket.IO",
    icon: Workflow,
    color: "text-white",
  },
  {
    name: "Yjs CRDT",
    icon: Boxes,
    color: "text-yellow-400",
  },
  {
    name: "MediaSoup",
    icon: Video,
    color: "text-violet-400",
  },
  {
    name: "Redis",
    icon: Database,
    color: "text-red-400",
  },
  {
    name: "Docker",
    icon: Cpu,
    color: "text-cyan-400",
  },
  {
    name: "JWT",
    icon: ShieldCheck,
    color: "text-emerald-400",
  },
];

const marquee = [...technologies, ...technologies];

export default function TechMarquee() {
  return (
    <section className="py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          badge="Technology Stack"
          title="Powered by Modern Technologies"
          subtitle="CodeArenaX combines industry-leading technologies to deliver a seamless collaborative coding experience."
        />
      </div>

      <div className="relative mt-12">
        {/* Left Fade */}

        <div className="absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-[#020617] to-transparent" />

        {/* Right Fade */}

        <div className="absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-[#020617] to-transparent" />

        <div className="flex whitespace-nowrap animate-marquee">
          {marquee.map((tech, index) => {
            const Icon = tech.icon;

            return (
              <div
                key={`${tech.name}-${index}`}
                className="mx-4 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-8 py-5 backdrop-blur-xl"
              >
                <Icon size={28} className={tech.color} />

                <span className="text-lg font-semibold text-white">
                  {tech.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
