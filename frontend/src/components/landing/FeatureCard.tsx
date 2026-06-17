import type { LucideIcon } from "lucide-react";

import GlassCard from "../ui/GlassCard";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  tags?: string[];
  accent?: "cyan" | "purple" | "green" | "orange";
}

const accentColors = {
  cyan: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    icon: "text-cyan-400",
    tag: "bg-cyan-500/10 text-cyan-300",
  },
  purple: {
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    icon: "text-violet-400",
    tag: "bg-violet-500/10 text-violet-300",
  },
  green: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: "text-emerald-400",
    tag: "bg-emerald-500/10 text-emerald-300",
  },
  orange: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    icon: "text-orange-400",
    tag: "bg-orange-500/10 text-orange-300",
  },
};

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  tags = [],
  accent = "cyan",
}: FeatureCardProps) {
  const color = accentColors[accent];

  return (
    <GlassCard
      className={`group h-full border ${color.border} p-7 transition-all duration-500 hover:-translate-y-2`}
    >
      <div
        className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${color.bg}`}
      >
        <Icon
          size={30}
          className={`${color.icon} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}
        />
      </div>

      <h3 className="mb-4 text-2xl font-bold text-white">{title}</h3>

      <p className="mb-6 leading-7 text-slate-400">{description}</p>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`rounded-full px-3 py-1 text-xs font-medium ${color.tag}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
