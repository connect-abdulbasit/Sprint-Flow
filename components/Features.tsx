const features = [
  {
    icon: "📋",
    title: "Kanban Boards",
    desc: "Drag-and-drop cards across customizable columns. Visualize work in progress and keep your team aligned on what's moving.",
  },
  {
    icon: "🔁",
    title: "Sprint Management",
    desc: "Plan sprints from your backlog, set goals, and track completion with built-in burndown and velocity charts.",
  },
  {
    icon: "📊",
    title: "Reports & Analytics",
    desc: "Understand your team's throughput, spot bottlenecks, and make data-driven decisions every sprint.",
  },
  {
    icon: "🏷️",
    title: "Labels & Priorities",
    desc: "Tag issues by type, component, or urgency. Filter your board instantly to see only what matters.",
  },
  {
    icon: "👥",
    title: "Team Assignments",
    desc: "Assign issues to team members, track individual workloads, and balance capacity across your sprint.",
  },
  {
    icon: "🔔",
    title: "Smart Notifications",
    desc: "Get notified when you're assigned, mentioned, or when an issue you care about changes — no noise, just signal.",
  },
];

export default function Features() {
  return (
    <section className="max-w-5xl mx-auto px-12 py-24" id="features">
      <div className="text-[0.78rem] font-medium uppercase tracking-[0.12em] text-[#4f7cff] mb-4 reveal">
        Core Features
      </div>
      <h2
        className="text-4xl md:text-5xl font-black tracking-[-0.03em] leading-[1.1] max-w-xl mb-16 reveal"
        style={{ fontFamily: "Syne, sans-serif" }}
      >
        Everything your team needs to ship.
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5">
        {features.map((f) => (
          <div
            key={f.title}
            className="bg-[#111118] border border-white/7 p-8 group relative overflow-hidden cursor-default hover:bg-[#18181f] transition-colors duration-200 reveal"
          >
            {/* Top accent line on hover */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#4f7cff] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="w-11 h-11 rounded-[10px] bg-[#18181f] border border-white/7 flex items-center justify-center text-xl mb-5">
              {f.icon}
            </div>
            <div
              className="text-base font-bold tracking-[-0.01em] mb-2.5 text-[#f0f0f5]"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              {f.title}
            </div>
            <p className="text-sm text-[#9090a8] leading-[1.65] font-light">
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
