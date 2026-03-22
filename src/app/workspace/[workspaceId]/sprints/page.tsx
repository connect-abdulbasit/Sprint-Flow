export default function SprintsPage() {
  return (
    <div className="flex flex-col gap-3 pt-4">
      <h1
        className="text-2xl font-extrabold tracking-[-0.02em] text-[#f0f0f5]"
        style={{ fontFamily: "var(--font-syne)" }}
      >
        Sprints
      </h1>
      <p className="text-sm text-[var(--color-muted)]">
        Plan, start, and track your sprints — review velocity and completion rates.
      </p>
    </div>
  );
}
