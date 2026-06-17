import { useEffect, useState } from "react";
import { Code2, Menu, X, ArrowRight } from "lucide-react";

const navLinks = [
  {
    name: "Features",
    href: "#features",
  },
  {
    name: "Architecture",
    href: "#architecture",
  },
  {
    name: "Roadmap",
    href: "#roadmap",
  },
  {
    name: "FAQ",
    href: "#faq",
  },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavigation = (href: string) => {
    setMobileOpen(false);

    const element = document.querySelector(href);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "border-b border-white/10 bg-slate-950/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        {/* Logo */}

        <button
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
          className="flex items-center gap-3"
        >
          <div className="rounded-xl bg-cyan-500/10 p-2">
            <Code2 size={28} className="text-cyan-400" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-white">CodeArenaX</h1>

            <p className="text-xs text-slate-400">Collaborative IDE</p>
          </div>
        </button>

        {/* Desktop Navigation */}

        <nav className="hidden items-center gap-10 lg:flex">
          {navLinks.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.href)}
              className="text-sm font-medium text-slate-300 transition hover:text-cyan-400"
            >
              {item.name}
            </button>
          ))}
        </nav>

        {/* Desktop Actions */}

        <div className="hidden items-center gap-4 lg:flex">
          {/* <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-cyan-500 hover:text-cyan-400"
          >
            <Github size={20} />
          </a> */}

          <button className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400">
            Get Started
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Mobile Menu */}

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg border border-white/10 bg-white/5 p-2 lg:hidden"
        >
          {mobileOpen ? (
            <X className="text-white" />
          ) : (
            <Menu className="text-white" />
          )}
        </button>
      </div>

      {/* Mobile Drawer */}

      {mobileOpen && (
        <div className="border-t border-white/10 bg-slate-950 lg:hidden">
          <div className="flex flex-col gap-2 p-6">
            {navLinks.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className="rounded-lg px-4 py-3 text-left text-slate-300 transition hover:bg-white/5 hover:text-cyan-400"
              >
                {item.name}
              </button>
            ))}
{/* 
            <a
              href="https://github.com/"
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400"
            >
              <Github size={18} />
              GitHub
            </a> */}

            <button className="mt-3 rounded-xl bg-cyan-500 py-3 font-semibold text-slate-950">
              Get Started
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
