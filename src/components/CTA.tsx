export default function CTA() {
  return (
    <section className="py-32 px-12 text-center relative overflow-hidden">
      {/* Glow */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(79,124,255,0.1) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      <h2
        className="text-5xl md:text-6xl font-black tracking-[-0.03em] leading-[1.1] max-w-2xl mx-auto mb-6 reveal relative z-10"
        style={{ fontFamily: "Syne, sans-serif" }}
      >
        Ready to run better sprints?
      </h2>
      <p className="text-base text-[#9090a8] font-light mb-10 reveal relative z-10">
        Get your team set up in minutes.
      </p>
      <div className="flex items-center justify-center gap-3.5 reveal relative z-10">
        <button className="px-7 py-3.5 text-[0.95rem] font-medium text-white bg-[#4f7cff] rounded-xl hover:opacity-90 hover:-translate-y-px transition-all duration-200 cursor-pointer border-none font-[inherit]">
          Create your workspace →
        </button>
      </div>
    </section>
  );
}
