import {
  LogIn,
  FolderPlus,
  Users,
  Code2,
  Terminal,
  Video,
  Rocket,
} from "lucide-react";

import GlassCard from "../ui/GlassCard";
import SectionHeading from "../ui/SectionHeading";

interface TimelineStep {
  title: string;
  description: string;
  icon: typeof LogIn;
  color: string;
}

const timeline: TimelineStep[] = [
  {
    title: "Authenticate",
    description: "Securely login using JWT Authentication or Google OAuth.",
    icon: LogIn,
    color: "text-cyan-400",
  },
  {
    title: "Create / Join Room",
    description:
      "Create a collaborative workspace or join an existing coding room.",
    icon: FolderPlus,
    color: "text-violet-400",
  },
  {
    title: "Collaborate",
    description:
      "Edit code simultaneously using Yjs CRDT with real-time synchronization.",
    icon: Users,
    color: "text-green-400",
  },
  {
    title: "Develop",
    description:
      "Write code in Monaco Editor with syntax highlighting and multi-language support.",
    icon: Code2,
    color: "text-orange-400",
  },
  {
    title: "Execute",
    description:
      "Run JavaScript, Python or C++ securely using the execution service.",
    icon: Terminal,
    color: "text-pink-400",
  },
  {
    title: "Communicate",
    description:
      "Discuss ideas instantly using integrated chat and MediaSoup-powered voice/video calls.",
    icon: Video,
    color: "text-sky-400",
  },
  {
    title: "Build Together",
    description:
      "Complete collaborative development faster with synchronized workflows.",
    icon: Rocket,
    color: "text-yellow-400",
  },
];

export default function Timeline() {
  return (
    <section id="workflow" className="py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          badge="Workflow"
          title="How CodeArenaX Works"
          subtitle="A seamless development workflow designed for modern collaborative programming."
        />

        <div className="relative">
          {/* Vertical Line */}

          <div className="absolute left-7 top-0 hidden h-full w-[2px] bg-gradient-to-b from-cyan-500 via-violet-500 to-transparent lg:block" />

          <div className="space-y-10">
            {timeline.map((step, index) => {
              const Icon = step.icon;

              return (
                <div key={step.title} className="relative flex gap-8">
                  {/* Icon */}

                  <div className="relative z-10 hidden lg:flex">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-slate-900">
                      <Icon size={26} className={step.color} />
                    </div>
                  </div>

                  {/* Card */}

                  <GlassCard className="flex-1 p-8">
                    <div className="flex items-center gap-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 font-bold">
                        {index + 1}
                      </span>

                      <h3 className="text-2xl font-bold text-white">
                        {step.title}
                      </h3>
                    </div>

                    <p className="mt-5 leading-8 text-slate-400">
                      {step.description}
                    </p>
                  </GlassCard>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
