"use client";

import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import CreateSprintModal from "@/components/project/CreateSprintModal";
import { Calendar, Plus, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
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

  const load = useCallback(() => {
    if (!pid) return;
    setLoading(true);
    fetchSprints(pid)
      .then(setSprints)
      .catch(() => setSprints([]))
      .finally(() => setLoading(false));
  }, [pid]);

  useEffect(() => {
    load();
  }, [load]);

  const active = sprints.filter((s) => s.status === "active");
  const planning = sprints.filter((s) => s.status === "planning");
  const completed = sprints.filter((s) => s.status === "completed");

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-zinc-200">Sprint timeline</h2>
            <p className="text-[12px] text-zinc-500 mt-0.5">
              All sprints for this project. Plan work and run the sprint from the backlog.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/workspace/${wid}/projects/${pid}/backlog`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[12px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition-all"
            >
              Backlog
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-[12px] font-semibold rounded-lg transition-all active:scale-[0.98] shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              New sprint
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-zinc-500 gap-2 text-[13px]">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading sprints…
          </div>
        ) : sprints.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.08] bg-[#111115]/40 px-8 py-16 text-center">
            <Calendar className="mx-auto h-10 w-10 text-zinc-600 mb-4" />
            <p className="text-[14px] font-medium text-zinc-400">No sprints yet</p>
            <p className="text-[12px] text-zinc-600 mt-1 max-w-md mx-auto">
              Create a sprint with dates and a goal, add tickets from the backlog, then start it
              when the team is ready.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex mt-6 items-center gap-2 rounded-lg bg-blue-500/15 border border-blue-500/20 px-4 py-2 text-[12px] font-medium text-blue-400 hover:bg-blue-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Create first sprint
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {active.length > 0 && (
              <section>
                <h3 className="text-[12px] font-semibold uppercase tracking-wide text-emerald-500/90 mb-3">
                  Active
                </h3>
                <ul className="space-y-2">
                  {active.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-emerald-500/15 bg-emerald-500/[0.04] px-4 py-3"
                    >
                      <div>
                        <p className="text-[14px] font-medium text-zinc-200">{s.name}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {s.startDate} → {s.endDate}
                        </p>
                      </div>
                      <Link
                        href={`/workspace/${wid}/projects/${pid}/backlog`}
                        className="text-[12px] font-medium text-emerald-400 hover:text-emerald-300"
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
                <h3 className="text-[12px] font-semibold uppercase tracking-wide text-blue-400/90 mb-3">
                  Planned
                </h3>
                <ul className="space-y-2">
                  {planning.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#111115]/50 px-4 py-3"
                    >
                      <div>
                        <p className="text-[14px] font-medium text-zinc-200">{s.name}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {s.startDate} → {s.endDate}
                        </p>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/15">
                        planning
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-white/[0.03]" />
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.04] bg-white/[0.01]">
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600" />
                <span className="text-[11px] font-medium text-zinc-500">Completed</span>
              </div>
              <div className="h-px flex-1 bg-white/[0.03]" />
            </div>

            {completed.length === 0 ? (
              <p className="text-center text-[13px] text-zinc-600 py-6">No completed sprints yet</p>
            ) : (
              <ul className="space-y-2">
                {completed
                  .slice()
                  .sort((a, b) => b.endDate.localeCompare(a.endDate))
                  .map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-[#0c0c0f] px-4 py-3 opacity-80"
                    >
                      <div>
                        <p className="text-[14px] font-medium text-zinc-300">{s.name}</p>
                        <p className="text-[11px] text-zinc-600 mt-0.5">
                          {s.startDate} → {s.endDate}
                        </p>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-500 border border-zinc-500/15">
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
