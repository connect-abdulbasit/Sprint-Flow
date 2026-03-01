const steps = [
  {
    num: "01",
    title: "Build your backlog",
    desc: "Create issues, write descriptions, attach files, and set priorities. Everything in one place — no scattered docs or threads.",
  },
  {
    num: "02",
    title: "Plan your sprint",
    desc: "Drag issues into your sprint, assign them to teammates, and set a clear goal. Estimate effort and commit to what your team can actually deliver.",
  },
  {
    num: "03",
    title: "Track and ship",
    desc: "Move cards across the board as work progresses. Review at the end, run your retrospective, and do it again — better every time.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-[#111118] border-t border-b border-white/7" id="how-it-works">
      <div className="max-w-5xl mx-auto px-12 py-24">
        <div className="text-[0.78rem] font-medium uppercase tracking-[0.12em] text-[#4f7cff] mb-4 reveal">
          How it works
        </div>
        <h2
          className="text-4xl md:text-5xl font-black tracking-[-0.03em] leading-[1.1] max-w-lg mb-16 reveal"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          From idea to shipped in three steps.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step) => (
            <div key={step.num} className="reveal">
              <div
                className="text-[4rem] font-black tracking-[-0.05em] leading-none mb-4 text-[#18181f]"
                style={{
                  fontFamily: "Syne, sans-serif",
                  WebkitTextStroke: "1px rgba(255,255,255,0.07)",
                }}
              >
                {step.num}
              </div>
              <div
                className="text-lg font-bold mb-2.5 text-[#f0f0f5]"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                {step.title}
              </div>
              <p className="text-sm text-[#9090a8] leading-[1.7] font-light">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
