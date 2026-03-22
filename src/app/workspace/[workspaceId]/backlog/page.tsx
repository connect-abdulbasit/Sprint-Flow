export default function BacklogPage() {
  return (
    <div className="flex flex-col gap-3 pt-4">
      <h1
        className="text-2xl font-extrabold tracking-[-0.02em] text-[#f0f0f5]"
        style={{ fontFamily: "var(--font-syne)" }}
      >
        Backlog
      </h1>
      <p className="text-sm text-[var(--color-muted)]">
        Manage and prioritize upcoming work items before they move into a sprint.
      </p>
    </div>
  );
}
