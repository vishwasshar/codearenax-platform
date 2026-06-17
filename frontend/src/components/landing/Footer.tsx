import { Code2, Mail, ArrowUpRight } from "lucide-react";

const footerLinks = {
  Product: ["Features", "Architecture", "Roadmap", "Documentation"],
  Technologies: [
    "React",
    "NestJS",
    "MongoDB",
    "Socket.IO",
    "MediaSoup",
    "Yjs CRDT",
  ],
  Resources: ["GitHub", "Portfolio", "Report", "Presentation"],
};

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-[#020617]">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-cyan-500/10 p-3">
                <Code2 size={28} className="text-cyan-400" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">CodeArenaX</h2>

                <p className="text-sm text-slate-400">
                  Collaborative Coding Platform
                </p>
              </div>
            </div>

            <p className="max-w-md leading-7 text-slate-400">
              CodeArenaX is a modern collaborative development platform
              combining real-time editing, secure code execution, integrated
              communication and distributed synchronization into a unified
              developer workspace.
            </p>

            <div className="mt-8 flex gap-4">
              {/* <a
                href="https://github.com/"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-cyan-500 hover:text-cyan-400"
              >
                <Github size={20} />
              </a>

              <a
                href="https://linkedin.com/"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-cyan-500 hover:text-cyan-400"
              >
                <Linkedin size={20} />
              </a> */}

              <a
                href="mailto:your@email.com"
                className="rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-cyan-500 hover:text-cyan-400"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-6 text-lg font-semibold text-white">{title}</h3>

              <ul className="space-y-4">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="group flex items-center gap-2 text-slate-400 transition hover:text-cyan-400"
                    >
                      {link}

                      <ArrowUpRight
                        size={15}
                        className="opacity-0 transition group-hover:opacity-100"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="my-10 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Bottom */}
        <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} CodeArenaX. Built with React, NestJS,
            MongoDB, Yjs and MediaSoup.
          </p>

          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-cyan-400 transition">
              Privacy
            </a>

            <a href="#" className="hover:text-cyan-400 transition">
              Terms
            </a>

            <a href="#" className="hover:text-cyan-400 transition">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
