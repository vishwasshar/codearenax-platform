import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  fullWidth = false,
  className,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/30",

    secondary:
      "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700",

    outline: "border border-cyan-500 text-cyan-400 hover:bg-cyan-500/10",
  };

  return (
    <button
      className={clsx(
        "rounded-xl px-6 py-3 font-semibold transition-all duration-300",
        "hover:scale-105 active:scale-95",
        variants[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
