import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import GlassCard from "../ui/GlassCard";
import SectionHeading from "../ui/SectionHeading";

const screenshots = [
  {
    title: "Collaborative Editor",
    description:
      "Multiple developers edit code simultaneously using CRDT synchronization powered by Yjs and Socket.IO.",
    image: "/landing/editor.png",
    tech: ["Monaco", "Yjs", "Socket.IO"],
  },
  {
    title: "Code Execution",
    description:
      "Execute JavaScript, Python and C++ securely with isolated execution environments and real-time output.",
    image: "/landing/execution.png",
    tech: ["Docker", "Express", "Node.js"],
  },
  {
    title: "Voice & Video Collaboration",
    description:
      "Low-latency communication using MediaSoup SFU for seamless team collaboration.",
    image: "/landing/video.png",
    tech: ["MediaSoup", "WebRTC"],
  },
  {
    title: "Project Dashboard",
    description:
      "Monitor rooms, collaborators, execution history and developer activities.",
    image: "/landing/dashboard.png",
    tech: ["React", "Charts"],
  },
];

export default function Screenshots() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % screenshots.length);

  const previous = () =>
    setCurrent((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1));

  const screenshot = screenshots[current];

  return (
    <section id="screenshots" className="py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          badge="Showcase"
          title="Explore CodeArenaX"
          subtitle="Take a closer look at the collaborative development experience."
        />

        <GlassCard className="overflow-hidden">
          <div className="grid lg:grid-cols-2">
            {/* Left */}

            <div className="p-10 flex flex-col justify-center">
              <h3 className="text-3xl font-bold text-white">
                {screenshot.title}
              </h3>

              <p className="mt-6 leading-8 text-slate-400">
                {screenshot.description}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {screenshot.tech.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-cyan-500/10 px-3 py-1 text-sm text-cyan-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Right */}

            <div className="relative bg-slate-900 p-6">
              <img
                src={screenshot.image}
                alt={screenshot.title}
                className="h-full w-full rounded-xl border border-white/10 object-cover"
              />
            </div>
          </div>
        </GlassCard>

        {/* Controls */}

        <div className="mt-10 flex items-center justify-center gap-6">
          <button
            onClick={previous}
            className="rounded-full border border-white/10 bg-white/5 p-3 transition hover:border-cyan-500 hover:text-cyan-400"
          >
            <ChevronLeft />
          </button>

          <div className="flex gap-3">
            {screenshots.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`h-3 w-3 rounded-full transition ${
                  current === index ? "bg-cyan-400" : "bg-slate-600"
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="rounded-full border border-white/10 bg-white/5 p-3 transition hover:border-cyan-500 hover:text-cyan-400"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
}
