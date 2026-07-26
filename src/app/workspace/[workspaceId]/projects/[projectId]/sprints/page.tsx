"use client";

import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import CreateSprintModal from "@/components/project/CreateSprintModal";
import { Calendar, Plus, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";
import { SprintTimelineSkeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { fetchSprints, type ProjectSprint } from "@/lib/projects-api";

export default function ProjectSprintsPage() {
  const { workspaceId, projectId } = useParams();
  const wid = typeof workspaceId === "string" ? workspaceId : (workspaceId?.[0] ?? "");
  const pid = typeof projectId === "string" ? projectId : (projectId?.[0] ?? "");
  const [sprints, setSprints] = useState<ProjectSprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  // AUD-017: see overview/page.tsx — a failed fetch previously looked identical to
  // "zero sprints" with no error surfaced.
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!pid) return;
    setLoading(true);
    setLoadError(null);
    fetchSprints(pid)
      .then(setSprints)
      .catch((err) => {
        setSprints([]);
        setLoadError(err instanceof Error ? err.message : "Failed to load sprints.");
      })
      .finally(() => setLoading(false));
  }, [pid]);

  useEffect(() => {
    load();
  }, [load]);

  const active = sprints.filter((s) => s.status === "active");
  const planning = sprints.filter((s) => s.status === "planning");
  const completed = sprints.filter((s) => s.status === "completed");

  return (
    <div className="flex flex-col h-full bg-surface-sunken">
      <ProjectPageHeader />

      {modalOpen && (
        <CreateSprintModal
          projectId={pid}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            load();
          }}
        />
      )}

      <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8 custom-scrollbar">
        {loadError && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-xl border border-danger/20 bg-danger/[0.06] px-4 py-3 text-[13px] text-danger"
          >
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {loadError}
            </span>
            <button
              type="button"
              onClick={load}
              className="shrink-0 rounded-lg border border-danger/25 px-3 py-1.5 font-semibold text-danger hover:bg-danger/10"
            >
              Retry
            </button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-fg">Sprint timeline</h2>
            <p className="text-[12px] text-muted mt-0.5">
              All sprints for this project. Plan work and run the sprint from the backlog.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/workspace/${wid}/projects/${pid}/backlog`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-hover border border-border rounded-lg text-[12px] font-medium text-muted2 hover:text-fg hover:bg-hover transition-all"
            >
              Backlog
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-fg hover:bg-fg-strong text-bg text-[12px] font-semibold rounded-lg transition-all active:scale-[0.98] shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              New sprint
            </button>
          </div>
        </div>

        {loading ? (
          <SprintTimelineSkeleton />
        ) : sprints.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface/40 px-8 py-16 text-center">
            <Calendar className="mx-auto h-10 w-10 text-muted mb-4" />
            <p className="text-[14px] font-medium text-muted2">No sprints yet</p>
            <p className="text-[12px] text-muted mt-1 max-w-md mx-auto">
              Create a sprint with dates and a goal, add tickets from the backlog, then start it
              when the team is ready.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex mt-6 items-center gap-2 rounded-lg bg-accent/15 border border-accent/20 px-4 py-2 text-[12px] font-medium text-accent hover:bg-accent/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Create first sprint
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {active.length > 0 && (
              <section>
                <h3 className="text-[12px] font-semibold uppercase tracking-wide text-success/90 mb-3">
                  Active
                </h3>
                <ul className="space-y-2">
                  {active.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-success/15 bg-success/[0.04] px-4 py-3"
                    >
                      <div>
                        <p className="text-[14px] font-medium text-fg">{s.name}</p>
                        <p className="text-[11px] text-muted mt-0.5">
                          {s.startDate} → {s.endDate}
                        </p>
                      </div>
                      <Link
                        href={`/workspace/${wid}/projects/${pid}/backlog`}
                        className="text-[12px] font-medium text-success hover:text-success"
                      >
                        Open backlog
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {planning.length > 0 && (
              <section>
                <h3 className="text-[12px] font-semibold uppercase tracking-wide text-accent/90 mb-3">
                  Planned
                </h3>
                <ul className="space-y-2">
                  {planning.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-surface/50 px-4 py-3"
                    >
                      <div>
                        <p className="text-[14px] font-medium text-fg">{s.name}</p>
                        <p className="text-[11px] text-muted mt-0.5">
                          {s.startDate} → {s.endDate}
                        </p>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/15">
                        planning
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-hover" />
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-hover">
                <CheckCircle2 className="w-3.5 h-3.5 text-muted" />
                <span className="text-[11px] font-medium text-muted">Completed</span>
              </div>
              <div className="h-px flex-1 bg-hover" />
            </div>

            {completed.length === 0 ? (
              <p className="text-center text-[13px] text-muted py-6">No completed sprints yet</p>
            ) : (
              <ul className="space-y-2">
                {completed
                  .slice()
                  .sort((a, b) => b.endDate.localeCompare(a.endDate))
                  .map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-surface-sunken px-4 py-3 opacity-80"
                    >
                      <div>
                        <p className="text-[14px] font-medium text-muted2">{s.name}</p>
                        <p className="text-[11px] text-muted mt-0.5">
                          {s.startDate} → {s.endDate}
                        </p>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted/10 text-muted border border-muted/15">
                        completed
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}

        <div className="h-12" />
      </div>
    </div>
  );
}
