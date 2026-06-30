import { ArrowRight, Play } from "lucide-react";
import { FaGithub } from "react-icons/fa";

import HeroBackground from "./HeroBackground";
import HeroCodePreview from "./HeroCodePreview";
import FloatingTech from "./FloatingTech";

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden pt-32 pb-24">
      <HeroBackground />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-20 px-6 lg:flex-row">
        {/* Left */}

        <div className="flex-1">
          {/* Badge */}

          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300">
            🚀 Real-Time Collaborative IDE
          </div>

          {/* Heading */}

          <h1 className="mt-8 text-5xl font-extrabold leading-tight text-white md:text-7xl">
            Code
            <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 bg-clip-text text-transparent">
              ArenaX
            </span>
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-400 md:text-xl">
            A modern collaborative coding platform built with
            <span className="font-semibold text-cyan-400">
              {" "}
              React, NestJS, Yjs CRDT, MediaSoup, Socket.IO
            </span>{" "}
            and{" "}
            <span className="font-semibold text-cyan-400">
              Docker-powered code execution
            </span>
            . Collaborate, communicate and execute code seamlessly in one
            workspace.
          </p>

          {/* Buttons */}

          <div className="mt-10 flex flex-wrap gap-5">
            <a
              href="/login"
              className="flex items-center gap-3 rounded-xl bg-cyan-500 px-7 py-4 font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Get Started
              <ArrowRight size={20} />
            </a>
            <a
              href="https://github.com/vishwasshar"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-7 py-4 font-semibold text-white transition hover:border-cyan-400 hover:text-cyan-400"
            >
              <FaGithub size={20} />
              GitHub
            </a>

            <a
              href="/login"
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900 px-7 py-4 font-semibold text-white transition hover:border-violet-400"
            >
              <Play size={18} />
              Live Demo
            </a>
          </div>

          {/* Stats */}

          <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-4xl font-bold text-cyan-400">3+</h3>

              <p className="mt-2 text-sm text-slate-400">Languages</p>
            </div>

            <div>
              <h3 className="text-4xl font-bold text-violet-400">CRDT</h3>

              <p className="mt-2 text-sm text-slate-400">Synchronization</p>
            </div>

            <div>
              <h3 className="text-4xl font-bold text-emerald-400">SFU</h3>

              <p className="mt-2 text-sm text-slate-400">MediaSoup</p>
            </div>

            <div>
              <h3 className="text-4xl font-bold text-orange-400">JWT</h3>

              <p className="mt-2 text-sm text-slate-400">Authentication</p>
            </div>
          </div>
        </div>

        {/* Right */}

        <div className="relative flex flex-1 items-center justify-center">
          <HeroCodePreview />

          <FloatingTech />
        </div>
      </div>

      {/* Scroll Indicator */}

      <div className="mt-20 flex justify-center">
        <div className="flex flex-col items-center">
          <span className="mb-3 text-sm tracking-widest text-slate-500 uppercase">
            Scroll
          </span>

          <div className="flex h-12 w-7 justify-center rounded-full border border-white/20">
            <div className="mt-2 h-3 w-3 animate-bounce rounded-full bg-cyan-400" />
          </div>
        </div>
      </div>
    </section>
  );
}
