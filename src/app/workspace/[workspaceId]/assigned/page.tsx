export default function AssignedToMePage() {
  return (
    <div className="flex flex-col gap-3 pt-4">
      <h1
        className="text-2xl font-extrabold tracking-[-0.02em] text-[#f0f0f5]"
        style={{ fontFamily: "var(--font-syne)" }}
      >
        Assigned to Me
      </h1>
      <p className="text-sm text-[var(--color-muted)]">
        All tasks and issues assigned to you across every project in this workspace.
      </p>
    </div>
  );
}
