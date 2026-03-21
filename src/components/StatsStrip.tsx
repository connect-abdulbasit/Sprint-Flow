const stats = [
  { num: "3×", label: "faster sprint planning" },
  { num: "40%", label: "reduction in missed deadlines" },
  { num: "12k+", label: "issues tracked this month" },
  { num: "98%", label: "uptime SLA" },
];

export default function StatsStrip() {
  return (
    <div className="border-t border-b border-white/7 bg-[#111118] py-9">
      <div className="max-w-5xl mx-auto px-12 grid grid-cols-2 md:grid-cols-4 gap-0">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`px-10 py-0 reveal ${
              i < stats.length - 1 ? "border-r border-white/7" : ""
            } ${i === 0 ? "pl-0" : ""}`}
          >
            <div
              className="text-[2.5rem] font-black tracking-[-0.04em] gradient-text-muted"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              {s.num}
            </div>
            <div className="text-sm text-[#6b6b80] mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
