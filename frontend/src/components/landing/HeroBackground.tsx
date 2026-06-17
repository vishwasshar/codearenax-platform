export default function HeroBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#020617]" />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,.08) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/20 to-slate-950" />

      {/* Glow 1 */}
      <div className="absolute left-[-120px] top-[-120px] h-[420px] w-[420px] rounded-full bg-cyan-500/20 blur-[140px] animate-pulse" />

      {/* Glow 2 */}
      <div className="absolute bottom-[-180px] right-[-120px] h-[500px] w-[500px] rounded-full bg-violet-500/20 blur-[160px] animate-pulse" />

      {/* Glow 3 */}
      <div className="absolute left-1/2 top-1/3 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-[120px]" />

      {/* Decorative Rings */}
      <div className="absolute left-10 top-24 h-72 w-72 rounded-full border border-cyan-500/10" />
      <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full border border-violet-500/10" />

      {/* Floating Dots */}
      <div className="absolute left-[12%] top-[22%] h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_20px_#22d3ee]" />
      <div className="absolute left-[82%] top-[28%] h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_20px_#a855f7]" />
      <div className="absolute left-[65%] top-[70%] h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_20px_#38bdf8]" />
      <div className="absolute left-[20%] top-[75%] h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_20px_#67e8f9]" />

      {/* Noise Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, white 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />
    </div>
  );
}
