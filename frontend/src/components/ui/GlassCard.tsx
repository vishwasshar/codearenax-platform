import type { ReactNode } from "react";
import clsx from "clsx";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export default function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl",
        "border border-white/10",
        "bg-white/5",
        "backdrop-blur-xl",
        "shadow-xl",
        "transition-all duration-300",
        "hover:border-cyan-500/30",
        "hover:shadow-cyan-500/10",
        "hover:-translate-y-1",
        className,
      )}
    >
      {children}
    </div>
  );
}
