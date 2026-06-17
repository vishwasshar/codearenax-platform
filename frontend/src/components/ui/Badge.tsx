import type { ReactNode } from "react";
import clsx from "clsx";

interface BadgeProps {
  children: ReactNode;
  color?: "cyan" | "purple" | "green" | "orange";
}

export default function Badge({ children, color = "cyan" }: BadgeProps) {
  const colors = {
    cyan: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    purple: "bg-violet-500/15 text-violet-400 border-violet-500/30",
    green: "bg-green-500/15 text-green-400 border-green-500/30",
    orange: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border",
        "px-3 py-1 text-sm font-medium backdrop-blur",
        colors[color],
      )}
    >
      {children}
    </span>
  );
}
