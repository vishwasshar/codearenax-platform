import {
  Atom,
  Database,
  Server,
  Workflow,
  ShieldCheck,
  Video,
  Boxes,
  Cpu,
} from "lucide-react";

interface FloatingItem {
  name: string;
  icon: typeof Atom;
  color: string;
  position: string;
}

const items: FloatingItem[] = [
  {
    name: "React",
    icon: Atom,
    color: "text-sky-400",
    position: "-top-8 left-8",
  },
  {
    name: "NestJS",
    icon: Server,
    color: "text-red-400",
    position: "top-8 -right-10",
  },
  {
    name: "MongoDB",
    icon: Database,
    color: "text-green-400",
    position: "bottom-12 -left-12",
  },
  {
    name: "Socket.IO",
    icon: Workflow,
    color: "text-white",
    position: "bottom-0 right-0",
  },
  {
    name: "MediaSoup",
    icon: Video,
    color: "text-violet-400",
    position: "top-1/2 -left-14",
  },
  {
    name: "Yjs",
    icon: Boxes,
    color: "text-yellow-400",
    position: "top-1/2 -right-16",
  },
  {
    name: "Docker",
    icon: Cpu,
    color: "text-cyan-400",
    position: "bottom-28 right-16",
  },
  {
    name: "JWT",
    icon: ShieldCheck,
    color: "text-emerald-400",
    position: "top-20 left-20",
  },
];

export default function FloatingTech() {
  return (
    <>
      {items.map((item, index) => {
        const Icon = item.icon;

        return (
          <div
            key={item.name}
            className={`
              absolute
              hidden
              xl:flex
              ${item.position}
              animate-float
              items-center
              gap-3
              rounded-xl
              border
              border-white/10
              bg-slate-900/80
              px-4
              py-3
              backdrop-blur-xl
              shadow-xl
              transition-all
              duration-300
              hover:scale-110
              hover:border-cyan-400
            `}
            style={{
              animationDelay: `${index * 0.4}s`,
            }}
          >
            <Icon size={18} className={item.color} />

            <span className="text-sm font-medium text-white whitespace-nowrap">
              {item.name}
            </span>
          </div>
        );
      })}
    </>
  );
}
