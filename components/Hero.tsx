import BoardMockup from "./BoardMockup";

export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-28 pb-20 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(79,124,255,0.12) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -60%)",
        }}
      />

      {/* Floating blobs */}
      <div
        className="absolute w-96 h-96 rounded-full pointer-events-none animate-[float_8s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(circle, rgba(162,89,255,0.1) 0%, transparent 70%)",
          top: "20%",
          left: "10%",
        }}
      />
      <div
        className="absolute w-72 h-72 rounded-full pointer-events-none animate-[float_10s_ease-in-out_infinite_reverse]"
        style={{
          background:
            "radial-gradient(circle, rgba(0,212,170,0.08) 0%, transparent 70%)",
          bottom: "20%",
          right: "10%",
        }}
      />

      {/* Badge */}
      <div className="inline-flex items-center gap-1.5 bg-[#18181f] border border-white/7 rounded-full px-3.5 py-1.5 text-[0.78rem] text-[#9090a8] mb-8 animate-[fadeUp_0.6s_ease_both] opacity-0">
        <span
          className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-[pulse2_2s_ease_infinite]"
          style={{ boxShadow: "0 0 8px #00d4aa" }}
        />
        Built for software engineering teams
      </div>

      {/* Heading */}
      <h1
        className="font-black text-5xl md:text-7xl tracking-[-0.03em] leading-[1.05] max-w-3xl mb-6 animate-[fadeUp_0.6s_0.1s_ease_both] opacity-0"
        style={{ fontFamily: "Syne, sans-serif" }}
      >
        Track sprints.
        <br />
        Ship with{" "}
        <span className="gradient-text">clarity</span>.
      </h1>

      {/* Subtitle */}
      <p className="text-lg text-[#9090a8] max-w-lg font-light leading-[1.7] mb-11 animate-[fadeUp_0.6s_0.2s_ease_both] opacity-0">
        SprintFlow brings your team&apos;s work into focus — from backlog to
        done, without the noise. Purpose-built for agile teams who ship fast.
      </p>

      {/* Actions */}
      <div className="flex items-center gap-3.5 animate-[fadeUp_0.6s_0.3s_ease_both] opacity-0">
        <button className="px-7 py-3.5 text-[0.95rem] font-medium text-white bg-[#4f7cff] rounded-xl hover:opacity-90 hover:-translate-y-px transition-all duration-200 cursor-pointer border-none font-[inherit]">
          Start for free →
        </button>
        <button className="flex items-center gap-2 px-7 py-3.5 text-[0.95rem] text-[#f0f0f5] bg-transparent border border-white/7 rounded-xl hover:border-white/20 hover:bg-[#18181f] transition-all duration-200 cursor-pointer font-[inherit]">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Watch demo
        </button>
      </div>

      {/* Note */}
      <p className="mt-4 text-[0.8rem] text-[#6b6b80] animate-[fadeUp_0.6s_0.4s_ease_both] opacity-0">
        Free for teams up to 5 · No credit card needed
      </p>

      {/* Board Mockup */}
      <BoardMockup />
    </section>
  );
}
