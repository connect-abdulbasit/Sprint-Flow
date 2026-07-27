/** Epic completion is a positive metric (higher = better), not a severity
 * ramp — the fill stays on the accent color across 0-99% and only switches to
 * success at 100%, rather than ramping toward danger as it approaches
 * completion (which would invert the metric's meaning). */
export function ProgressRing({
  percent,
  size = 40,
  strokeWidth = 4,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const isDone = clamped >= 100;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isDone ? "var(--color-success)" : "var(--color-accent)"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold tabular-nums text-muted2">
        {clamped}%
      </span>
    </div>
  );
}

export function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const isDone = clamped >= 100;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 min-w-[60px] flex-1 overflow-hidden rounded-full bg-hover-strong">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${isDone ? "bg-success" : "bg-accent"}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted2">{clamped}%</span>
    </div>
  );
}
