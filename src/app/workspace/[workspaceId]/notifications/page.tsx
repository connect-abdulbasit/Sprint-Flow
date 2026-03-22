export default function NotificationsPage() {
  return (
    <div className="flex flex-col gap-3 pt-4">
      <h1
        className="text-2xl font-extrabold tracking-[-0.02em] text-[#f0f0f5]"
        style={{ fontFamily: "var(--font-syne)" }}
      >
        Notifications
      </h1>
      <p className="text-sm text-[var(--color-muted)]">
        Stay updated — mentions, task assignments, and sprint updates all in one place.
      </p>
    </div>
  );
}
