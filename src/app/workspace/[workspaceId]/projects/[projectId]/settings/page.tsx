"use client";

import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import { Settings, Palette, Bell, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchProject, type Project } from "@/lib/projects-api";
import { projectKeyPrefix } from "@/lib/ticket-key";

export default function ProjectSettingsPage() {
  const { projectId } = useParams();
  const pid = typeof projectId === "string" ? projectId : (projectId?.[0] ?? "");
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!pid) return;
    fetchProject(pid)
      .then(setProject)
      .catch(() => setProject(null));
  }, [pid]);

  const name = project?.name ?? "";
  const description = project?.description ?? "";
  const key = project ? projectKeyPrefix(project.name) : "";

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      <ProjectPageHeader />

      <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">
        <div className="max-w-2xl space-y-8">
          <div>
            <h2 className="text-[15px] font-semibold text-zinc-200">Project Settings</h2>
            <p className="text-[12px] text-zinc-500 mt-0.5">Manage your project configuration</p>
          </div>

          <div className="bg-[#111115] border border-white/[0.05] rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2 text-zinc-300">
              <Settings className="w-4 h-4 text-zinc-500" />
              <h3 className="text-[14px] font-semibold">General</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Project Name
                </label>
                <input
                  key={name}
                  type="text"
                  defaultValue={name}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-2.5 text-[14px] text-zinc-200 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Key prefix
                </label>
                <input
                  type="text"
                  readOnly
                  value={key}
                  className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-2.5 text-[14px] font-mono text-zinc-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  key={description}
                  defaultValue={description}
                  rows={3}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3 text-[14px] text-zinc-200 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#111115] border border-white/[0.05] rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2 text-zinc-300">
              <Palette className="w-4 h-4 text-zinc-500" />
              <h3 className="text-[14px] font-semibold">Appearance</h3>
            </div>
            <p className="text-[12px] text-zinc-600">
              Project color themes will be saved here when the setting is wired to the API.
            </p>
          </div>

          <div className="bg-[#111115] border border-white/[0.05] rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2 text-zinc-300">
              <Bell className="w-4 h-4 text-zinc-500" />
              <h3 className="text-[14px] font-semibold">Notifications</h3>
            </div>
            <div className="space-y-3">
              {[
                "Email notifications for task updates",
                "Slack integration alerts",
                "Weekly digest summary",
              ].map((item) => (
                <div key={item} className="flex items-center justify-between py-2">
                  <span className="text-[13px] text-zinc-400">{item}</span>
                  <div className="w-9 h-5 rounded-full bg-zinc-700 relative cursor-pointer">
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-zinc-400 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111115] border border-red-500/10 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <Trash2 className="w-4 h-4" />
              <h3 className="text-[14px] font-semibold">Danger Zone</h3>
            </div>
            <p className="text-[12px] text-zinc-500">
              Permanently delete this project and all of its data. This action cannot be undone.
            </p>
            <button
              type="button"
              className="px-4 py-2 bg-red-500/10 text-red-400 text-[12px] font-medium rounded-lg border border-red-500/20 hover:bg-red-500/15 transition-all"
            >
              Delete Project
            </button>
          </div>

          <div className="h-12" />
        </div>
      </div>
    </div>
  );
}
