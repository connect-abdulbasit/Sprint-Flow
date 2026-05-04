import type { ComponentProps } from "react";
import Link from "next/link";
import { Briefcase, Plus, Settings, Shield, ShieldAlert, UserCircle, Users } from "lucide-react";

const pulse = "animate-pulse bg-white/[0.06]";

export function Skeleton({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`rounded-md ${pulse} ${className}`} {...props} />;
}

export function OrganizationCardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-[var(--color-surface)] border border-white/[0.06] p-6"
        >
          <div className="flex items-start justify-between mb-6">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-6 w-14 rounded-lg" />
          </div>
          <Skeleton className="h-6 w-3/4 rounded-lg mb-2" />
          <Skeleton className="h-3 w-28 rounded mb-6" />
          <Skeleton className="h-12 w-full rounded-lg mt-auto" />
        </div>
      ))}
    </div>
  );
}

/** @deprecated Use OrganizationCardsSkeleton */
export const OrganizationsGridSkeleton = OrganizationCardsSkeleton;

export function OrganizationDetailDataSkeleton({
  settingsHref,
}: {
  settingsHref?: string;
} = {}) {
  const statLabels = ["Workspaces", "Members", "Active Tasks"];
  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
          <div className="space-y-2 min-w-0 flex-1">
            <Skeleton className="h-8 w-48 max-w-full rounded-lg" />
            <Skeleton className="h-4 w-full max-w-md rounded" />
          </div>
        </div>
        {settingsHref ? (
          <Link
            href={settingsHref}
            className="p-2.5 text-[var(--color-muted)] hover:text-[#f0f0f5] bg-[var(--color-surface)] border border-white/[0.06] rounded-xl transition-colors shrink-0"
          >
            <Settings className="w-[18px] h-[18px]" />
          </Link>
        ) : (
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
        )}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {statLabels.map((label) => (
          <div
            key={label}
            className="flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-[var(--color-surface)] border border-white/[0.06]"
          >
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div>
              <Skeleton className="h-8 w-12 rounded-lg mb-1" />
              <p className="text-xs text-[var(--color-muted)] mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
            Workspaces
          </h2>
          <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] opacity-40 pointer-events-none">
            <Plus className="w-3.5 h-3.5" />
            New workspace
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/[0.06] bg-[var(--color-surface)] p-5"
            >
              <Skeleton className="h-5 w-3/4 rounded-lg mb-3" />
              <Skeleton className="h-4 w-full rounded mb-2" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/** @deprecated Use OrganizationDetailDataSkeleton */
export const OrganizationDetailSkeleton = OrganizationDetailDataSkeleton;

const DASH_STAT_LABELS = ["Tasks Completed", "In Progress", "Story Points", "Blocked"];

export function DashboardPageSkeleton() {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <Skeleton className="h-11 w-56 rounded-xl shrink-0" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {DASH_STAT_LABELS.map((label) => (
          <div
            key={label}
            className="rounded-2xl bg-[var(--color-surface)] border border-white/[0.06] p-5"
          >
            <Skeleton className="h-10 w-10 rounded-xl mb-4" />
            <Skeleton className="h-9 w-14 rounded-lg mb-2" />
            <p className="text-xs text-[var(--color-muted)]">{label}</p>
            <Skeleton className="h-3 w-28 rounded mt-2 opacity-60" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-[var(--color-surface)] border border-white/[0.06] p-6 space-y-6">
          <div className="flex justify-between items-start gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
              Sprint Progress
            </h2>
            <Skeleton className="h-5 w-24 rounded-md shrink-0" />
          </div>
          <div className="flex justify-center py-2">
            <Skeleton className="h-[130px] w-[130px] rounded-full" />
          </div>
          <div className="space-y-3">
            {["Completed", "In Progress", "To Do"].map((row) => (
              <div key={row} className="flex justify-between items-center gap-3">
                <span className="text-xs text-[var(--color-muted2)]">{row}</span>
                <Skeleton className="h-4 w-8 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 rounded-2xl bg-[var(--color-surface)] border border-white/[0.06] p-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
              Burndown Chart
            </h2>
            <Skeleton className="h-3 w-24 rounded" />
          </div>
          <Skeleton className="h-[180px] w-full rounded-xl mb-3" />
          <div className="flex justify-between text-[10px] text-[var(--color-muted)]">
            <span>Day 1</span>
            <Skeleton className="h-3 w-10 rounded inline-block" />
            <span>Day …</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-[var(--color-surface)] border border-white/[0.06] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
              Recent Tasks
            </h2>
            <span className="text-xs font-medium text-[var(--color-accent)] opacity-50">
              View all
            </span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-3.5">
                <Skeleton className="h-2 w-2 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-4 w-full max-w-md rounded" />
                </div>
                <Skeleton className="h-7 w-7 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl bg-[var(--color-surface)] border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.05]">
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
                Activity
              </h2>
            </div>
            <div className="px-5 py-3 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-[var(--color-surface)] border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.05]">
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
                Team Workload
              </h2>
            </div>
            <div className="px-5 py-3 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1.5">
                    <Skeleton className="h-3 w-24 rounded" />
                    <Skeleton className="h-3 w-10 rounded" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function SettingsFormSkeleton({ variant }: { variant: "workspace" | "organization" }) {
  return (
    <div className="max-w-4xl mx-auto space-y-16 pb-24">
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-white/[0.04] pb-6">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">General</h2>
            <p className="text-[14px] text-zinc-500 mt-1">
              {variant === "workspace"
                ? "Name and description for this workspace."
                : "Name and description for this organization."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-1">
            <h3 className="text-[14px] font-semibold text-zinc-200">Details</h3>
            <p className="text-[12px] text-zinc-500 leading-relaxed">
              {variant === "workspace"
                ? "Shown to members across the workspace."
                : "Shown wherever this organization is listed."}
            </p>
          </div>
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500">
                {variant === "workspace" ? "Workspace name" : "Organization name"}
              </label>
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500">
                Description
              </label>
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/** @deprecated Use SettingsFormSkeleton + page chrome */
export function SettingsPageSkeleton() {
  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      <SettingsFormSkeleton variant="workspace" />
    </div>
  );
}

const TEAM_STAT_META = [
  { label: "Total Members", Icon: Users, color: "#4f7cff" },
  { label: "Admins", Icon: Shield, color: "#a259ff" },
  { label: "Project Managers", Icon: Briefcase, color: "#ff9f43" },
  { label: "Members", Icon: UserCircle, color: "#00d4aa" },
] as const;

export function TeamDataSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TEAM_STAT_META.map(({ label, Icon, color }) => (
          <div
            key={label}
            className="group relative p-5 rounded-2xl bg-[var(--color-surface)] border border-white/[0.06]"
          >
            <div className="relative flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: `color-mix(in srgb, ${color} 12%, transparent)`,
                }}
              >
                <Icon className="w-[18px] h-[18px]" style={{ color }} />
              </div>
            </div>
            <Skeleton className="h-8 w-16 rounded-lg mb-2" />
            <p className="text-xs text-[var(--color-muted)]">{label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-[var(--color-surface)] border border-white/[0.06] overflow-hidden">
        <div className="flex items-center gap-4 px-6 py-3 border-b border-white/[0.05] text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-[0.1em]">
          <div className="w-10" />
          <div className="flex-1">Member</div>
          <div className="w-36 hidden sm:block">Role</div>
          <div className="w-28 hidden md:block">Joined</div>
          <div className="w-8" />
        </div>
        <div className="divide-y divide-white/[0.03]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <Skeleton className="h-4 w-40 max-w-full rounded" />
                <Skeleton className="h-3 w-48 max-w-full rounded" />
              </div>
              <Skeleton className="h-6 w-24 rounded-lg hidden sm:block" />
              <Skeleton className="h-4 w-20 rounded hidden md:block" />
              <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** @deprecated Use TeamDataSkeleton */
export const TeamPageSkeleton = TeamDataSkeleton;

export function NotificationListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/[0.06] bg-[var(--color-surface)] p-5 flex gap-4"
        >
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 max-w-md rounded" />
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function InviteCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48 rounded-lg" />
          <Skeleton className="h-3 w-32 rounded" />
        </div>
      </div>
      <Skeleton className="h-px w-full rounded bg-white/[0.06]" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-5/6 rounded" />
      </div>
    </div>
  );
}

export function SprintTimelineSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#111115]/50 px-4 py-3"
        >
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-3 w-36 rounded" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function BoardColumnsSkeleton() {
  return (
    <div className="flex flex-nowrap gap-0 px-6 py-6">
      {Array.from({ length: 4 }).map((_, col) => (
        <div key={col} className="flex shrink-0 w-[300px] flex-col px-1">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-5 w-6 rounded ml-auto" />
          </div>
          <div className="flex-1 space-y-2 rounded-xl border border-white/[0.03] bg-zinc-900/30 p-2 min-h-[280px]">
            {Array.from({ length: col % 2 === 0 ? 3 : 2 }).map((__, row) => (
              <div
                key={row}
                className="rounded-lg border border-white/[0.05] bg-[#111115] p-3.5 space-y-2"
              >
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-14 rounded" />
                  <Skeleton className="h-5 w-16 rounded" />
                </div>
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-3 w-2/3 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function BacklogSectionsSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 2 }).map((_, s) => (
        <div
          key={s}
          className="rounded-xl border border-white/[0.06] bg-[#111115]/40 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-white/[0.05] flex justify-between">
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((__, i) => (
              <div key={i} className="flex gap-3 rounded-lg border border-white/[0.05] p-3">
                <Skeleton className="h-8 w-8 rounded shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** @deprecated Use BacklogSectionsSkeleton */
export const BacklogPageSkeleton = BacklogSectionsSkeleton;

const OVERVIEW_LABELS = ["Completion Rate", "Open work", "Active Tasks"];
const REPORTS_LABELS = ["Total Tasks", "Completed", "In Progress", "Done story points"];

export function ProjectStatGridSkeleton({ cols = 3 }: { cols?: 3 | 4 }) {
  const labels = cols === 4 ? REPORTS_LABELS : OVERVIEW_LABELS;
  return (
    <div
      className={`grid gap-4 ${cols === 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-3"}`}
    >
      {labels.map((label) => (
        <div key={label} className="bg-[#111115] border border-white/[0.05] rounded-xl p-5">
          <Skeleton className="h-9 w-9 rounded-lg mb-4" />
          <p className="text-[12px] text-zinc-500">{label}</p>
          <Skeleton className="h-9 w-16 rounded-lg mt-2" />
        </div>
      ))}
    </div>
  );
}

export function ProjectOverviewDataSkeleton() {
  return (
    <div className="space-y-8">
      <ProjectStatGridSkeleton cols={3} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111115] border border-white/[0.05] rounded-xl p-6">
          <h3 className="text-[15px] font-semibold text-zinc-200 mb-6">Sprint Velocity</h3>
          <Skeleton className="h-[180px] w-full rounded-lg" />
        </div>
        <div className="bg-[#111115] border border-white/[0.05] rounded-xl p-6">
          <h3 className="text-[15px] font-semibold text-zinc-200 mb-6">Recent Activity</h3>
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-36 w-full rounded-xl border border-white/[0.05]" />
    </div>
  );
}

/** @deprecated Use ProjectOverviewDataSkeleton */
export const ProjectOverviewBodySkeleton = ProjectOverviewDataSkeleton;

export function ProjectReportsDataSkeleton() {
  return (
    <div className="space-y-8">
      <ProjectStatGridSkeleton cols={4} />
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#111115] border border-white/[0.05] rounded-xl p-6">
          <h3 className="text-[14px] font-semibold text-zinc-200 mb-6">Task Distribution</h3>
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="bg-[#111115] border border-white/[0.05] rounded-xl p-6">
          <h3 className="text-[14px] font-semibold text-zinc-200 mb-6">Priority Breakdown</h3>
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
      <div className="bg-[#111115] border border-white/[0.05] rounded-xl p-6">
        <h3 className="text-[14px] font-semibold text-zinc-200 mb-2">Sprint History</h3>
        <Skeleton className="h-24 w-full rounded-lg mt-4" />
      </div>
    </div>
  );
}

/** @deprecated Use ProjectReportsDataSkeleton */
export const ProjectReportsBodySkeleton = ProjectReportsDataSkeleton;

export function ProjectSettingsFormSkeleton() {
  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar px-6 py-10 sm:px-12 lg:px-20">
      <div className="max-w-4xl mx-auto space-y-16 pb-24">
        <section className="space-y-8 animate-fade-up">
          <div className="flex items-end justify-between border-b border-white/[0.04] pb-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">General</h2>
              <p className="text-[14px] text-zinc-500 mt-1">
                Fundamental settings for your project identity.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-1">
              <h3 className="text-[14px] font-semibold text-zinc-200">Identity</h3>
              <p className="text-[12px] text-zinc-500 leading-relaxed">
                Choose a clear name and description for your team.
              </p>
            </div>
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500">
                  Project Name
                </label>
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500">
                  Description
                </label>
                <Skeleton className="h-28 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/** @deprecated Use ProjectSettingsFormSkeleton inside layout with real sidebar */
export function ProjectSettingsBodySkeleton() {
  return (
    <div className="flex-1 flex overflow-hidden min-h-0">
      <aside className="w-[280px] shrink-0 border-r border-white/[0.04] bg-[#0c0c0f]/40 hidden lg:flex flex-col p-6">
        <div className="mb-8">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4 px-3">
            Project Settings
          </h2>
          <nav className="space-y-1">
            <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium bg-white/[0.06] text-white">
              <Settings className="w-4 h-4 text-blue-400" />
              General
            </div>
            <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-zinc-500">
              <ShieldAlert className="w-4 h-4 text-zinc-600" />
              Danger Zone
            </div>
          </nav>
        </div>
      </aside>
      <ProjectSettingsFormSkeleton />
    </div>
  );
}

export function ProjectGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#111115] border border-white/[0.05] rounded-2xl p-5">
          <div className="flex items-start justify-between mb-5">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="w-14 h-5 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4 rounded" />
            <Skeleton className="h-4 w-full rounded opacity-80" />
            <Skeleton className="h-4 w-2/3 rounded opacity-60" />
          </div>
          <div className="mt-6 pt-4 border-t border-white/[0.03]">
            <Skeleton className="h-3 w-24 rounded opacity-50" />
          </div>
        </div>
      ))}
    </div>
  );
}
