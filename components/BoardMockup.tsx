const tags = {
  bug: "bg-red-500/15 text-red-400",
  feat: "bg-[#4f7cff]/15 text-[#4f7cff]",
  imp: "bg-[#00d4aa]/15 text-[#00d4aa]",
  design: "bg-[#a259ff]/15 text-[#a259ff]",
};

function MockCard({
  tag,
  tagType,
  text,
  avatar,
  avatarGradient,
  initials,
  priority = "medium",
  done = false,
}: {
  tag: string;
  tagType: keyof typeof tags;
  text: string;
  avatar?: boolean;
  avatarGradient?: string;
  initials?: string;
  priority?: "high" | "medium" | "low";
  done?: boolean;
}) {
  const bars = {
    high: ["bg-red-400", "bg-red-400", "bg-red-400"],
    medium: ["bg-[#6b6b80]", "bg-[#6b6b80]", "bg-[#363646]"],
    low: ["bg-[#363646]", "bg-[#363646]", "bg-[#363646]"],
  };

  return (
    <div
      className={`bg-[#111118] border rounded-[6px] p-2.5 mb-1.5 cursor-pointer transition-all duration-200 hover:border-white/20 ${
        done ? "opacity-70" : "border-white/7"
      } ${tagType === "feat" && !done ? "border-[#4f7cff]/25" : ""}`}
    >
      <span
        className={`inline-block text-[0.6rem] px-1.5 py-0.5 rounded-[3px] font-medium mb-1.5 ${tags[tagType]}`}
      >
        {tag}
      </span>
      <div className="text-[0.72rem] text-[#f0f0f5] leading-snug mb-2">
        {text}
      </div>
      <div className="flex items-center justify-between">
        {avatar && initials && avatarGradient && (
          <div
            className={`w-[18px] h-[18px] rounded-full text-[0.55rem] flex items-center justify-center font-semibold text-white bg-gradient-to-br ${avatarGradient}`}
          >
            {initials}
          </div>
        )}
        {done ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#00d4aa"
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <div className="flex gap-0.5 items-end">
            {bars[priority].map((cls, i) => (
              <div
                key={i}
                className={`w-[3px] rounded-sm ${cls}`}
                style={{ height: `${6 + i * 4}px` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MockCol({
  title,
  count,
  titleColor,
  children,
}: {
  title: string;
  count: number;
  titleColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#18181f] rounded-lg p-2.5">
      <div className="flex items-center justify-between mb-2.5">
        <span
          className={`text-[0.68rem] font-semibold uppercase tracking-[0.06em] ${titleColor || "text-[#9090a8]"}`}
        >
          {title}
        </span>
        <span className="w-4 h-4 bg-[#111118] rounded text-[0.6rem] text-[#6b6b80] flex items-center justify-center">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

export default function BoardMockup() {
  return (
    <div className="w-full max-w-5xl mt-16 animate-[fadeUp_0.8s_0.5s_ease_both] opacity-0">
      <div
        className="bg-[#111118] border border-white/7 rounded-2xl overflow-hidden"
        style={{
          boxShadow:
            "0 0 0 1px rgba(79,124,255,0.1), 0 32px 80px rgba(0,0,0,0.6), 0 0 120px rgba(79,124,255,0.06)",
        }}
      >
        {/* Browser chrome bar */}
        <div className="bg-[#18181f] border-b border-white/7 px-4 py-3 flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 bg-[#111118] border border-white/7 rounded-md px-3 py-1 text-[0.75rem] text-[#6b6b80]">
            app.sprintflow.dev / projects / atlas / board
          </div>
        </div>

        {/* App body */}
        <div className="grid grid-cols-[200px_1fr] min-h-[400px]">
          {/* Sidebar */}
          <div className="bg-[#0d0d14] border-r border-white/7 p-4">
            <div
              className="flex items-center gap-1.5 text-[0.8rem] font-bold text-[#f0f0f5] mb-5 px-1"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              <div className="w-5 h-5 rounded bg-gradient-to-br from-[#4f7cff] to-[#a259ff] flex items-center justify-center text-[9px] font-bold text-white">
                A
              </div>
              Atlas Project
            </div>

            <div className="mb-4">
              <div className="text-[0.6rem] text-[#6b6b80] uppercase tracking-[0.1em] mb-1.5 px-1">
                Planning
              </div>
              {[
                { label: "Board", active: true, icon: "grid" },
                { label: "Backlog", active: false, icon: "check" },
                { label: "Sprints", active: false, icon: "clock" },
              ].map(({ label, active }) => (
                <div
                  key={label}
                  className={`flex items-center gap-2 px-2 py-[7px] rounded-md text-[0.75rem] mb-0.5 cursor-pointer ${
                    active
                      ? "bg-[#4f7cff]/15 text-[#4f7cff]"
                      : "text-[#9090a8] hover:bg-[#18181f]"
                  }`}
                >
                  <div className="w-3 h-3 rounded-sm opacity-70 bg-current" />
                  {label}
                </div>
              ))}
            </div>

            <div>
              <div className="text-[0.6rem] text-[#6b6b80] uppercase tracking-[0.1em] mb-1.5 px-1">
                Reports
              </div>
              {["Velocity", "Burndown"].map((label) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-2 py-[7px] rounded-md text-[0.75rem] text-[#9090a8] mb-0.5 cursor-pointer hover:bg-[#18181f]"
                >
                  <div className="w-3 h-3 rounded-sm opacity-70 bg-current" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Board main */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span
                  className="text-base font-bold text-[#f0f0f5]"
                  style={{ fontFamily: "Syne, sans-serif" }}
                >
                  Sprint 8
                </span>
                <span className="bg-[#4f7cff]/15 text-[#4f7cff] text-[0.65rem] font-medium px-2 py-0.5 rounded border border-[#4f7cff]/25">
                  Active · 6 days left
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <div className="w-7 h-7 bg-[#18181f] border border-white/7 rounded-md flex items-center justify-center cursor-pointer">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6b6b80"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <button className="bg-[#4f7cff] text-white text-[0.65rem] px-2.5 py-1 rounded-md border-none cursor-pointer font-[inherit]">
                  + Add Issue
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              <MockCol title="To Do" count={4}>
                <MockCard
                  tag="Feature"
                  tagType="feat"
                  text="OAuth2 integration with Google"
                  avatar
                  avatarGradient="from-[#4f7cff] to-[#a259ff]"
                  initials="AR"
                  priority="high"
                />
                <MockCard
                  tag="Design"
                  tagType="design"
                  text="Redesign settings panel"
                  avatar
                  avatarGradient="from-[#a259ff] to-[#00d4aa]"
                  initials="SN"
                  priority="medium"
                />
              </MockCol>

              <MockCol title="In Progress" count={3} titleColor="text-[#4f7cff]">
                <MockCard
                  tag="Bug"
                  tagType="bug"
                  text="Fix race condition in job queue"
                  avatar
                  avatarGradient="from-[#00d4aa] to-[#4f7cff]"
                  initials="KM"
                  priority="high"
                />
                <MockCard
                  tag="Improvement"
                  tagType="imp"
                  text="Optimize DB query for dashboard"
                  avatar
                  avatarGradient="from-[#febc2e] to-[#ff6b6b]"
                  initials="RJ"
                  priority="medium"
                />
              </MockCol>

              <MockCol title="In Review" count={2} titleColor="text-[#a259ff]">
                <MockCard
                  tag="Feature"
                  tagType="feat"
                  text="Email notification system"
                  avatar
                  avatarGradient="from-[#ff6b6b] to-[#a259ff]"
                  initials="TP"
                  priority="medium"
                />
              </MockCol>

              <MockCol title="Done" count={7} titleColor="text-[#00d4aa]">
                <MockCard
                  tag="Bug"
                  tagType="bug"
                  text="Fix login redirect loop"
                  avatar
                  avatarGradient="from-[#4f7cff] to-[#00d4aa]"
                  initials="AR"
                  done
                />
                <MockCard
                  tag="Improvement"
                  tagType="imp"
                  text="Add CSV export to reports"
                  avatar
                  avatarGradient="from-[#a259ff] to-[#4f7cff]"
                  initials="SN"
                  done
                />
              </MockCol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
