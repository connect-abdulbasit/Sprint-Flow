"use client";

import ProjectPageHeader from "@/components/project/ProjectPageHeader";
import {
  Settings,
  Palette,
  Bell,
  Trash2,
  ShieldAlert,
  Save,
  Info,
  ChevronRight,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { fetchProject, type Project } from "@/lib/projects-api";
import { projectKeyPrefix } from "@/lib/ticket-key";

export default function ProjectSettingsPage() {
  const { projectId } = useParams();
  const pid = typeof projectId === "string" ? projectId : (projectId?.[0] ?? "");
  const [project, setProject] = useState<Project | null>(null);
  const [activeSection, setActiveSection] = useState("general");

  const sections = {
    general: useRef<HTMLDivElement>(null),
    appearance: useRef<HTMLDivElement>(null),
    notifications: useRef<HTMLDivElement>(null),
    danger: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    if (!pid) return;
    let cancelled = false;
    fetchProject(pid)
      .then((p) => {
        if (!cancelled) setProject(p);
      })
      .catch(() => {
        if (!cancelled) setProject(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pid]);

  const scrollToSection = (id: keyof typeof sections) => {
    setActiveSection(id);
    sections[id].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const name = project?.name ?? "";
  const description = project?.description ?? "";
  const key = project ? projectKeyPrefix(project.name) : "";

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      <ProjectPageHeader />

      <div className="flex-1 flex overflow-hidden">
        {/* Settings Sidebar Navigation */}
        <aside className="w-[280px] shrink-0 border-r border-white/[0.04] bg-[#0c0c0f]/40 hidden lg:flex flex-col p-6">
          <div className="mb-8">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4 px-3">
              Project Settings
            </h2>
            <nav className="space-y-1">
              {[
                { id: "general", label: "General", icon: Settings },
                { id: "appearance", label: "Appearance", icon: Palette },
                { id: "notifications", label: "Notifications", icon: Bell },
                { id: "danger", label: "Danger Zone", icon: ShieldAlert, danger: true },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id as keyof typeof sections)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all group ${
                    activeSection === item.id
                      ? "bg-white/[0.06] text-white"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
                  } ${item.danger && activeSection === item.id ? "text-red-400" : ""}`}
                >
                  <item.icon
                    className={`w-4 h-4 transition-colors ${
                      activeSection === item.id
                        ? item.danger
                          ? "text-red-400"
                          : "text-blue-400"
                        : "text-zinc-600 group-hover:text-zinc-400"
                    }`}
                  />
                  {item.label}
                  {activeSection === item.id && (
                    <div className="ml-auto w-1 h-1 rounded-full bg-current opacity-60" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-white/[0.04]">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Info className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Need help?</span>
            </div>
            <p className="text-[12px] text-zinc-500 leading-relaxed">
              Managing large projects? Check our best practices for workspace organization.
            </p>
          </div>
        </aside>

        {/* Settings Content area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar px-6 py-10 sm:px-12 lg:px-20">
          <div className="max-w-4xl mx-auto space-y-16 pb-24">
            {/* General Section */}
            <section ref={sections.general} className="space-y-8 animate-fade-up">
              <div className="flex items-end justify-between border-b border-white/[0.04] pb-6">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">General</h2>
                  <p className="text-[14px] text-zinc-500 mt-1">
                    Fundamental settings for your project identity.
                  </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl text-[13px] font-semibold transition-all active:scale-95 shadow-lg shadow-white/5">
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
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
                    <input
                      key={name}
                      type="text"
                      defaultValue={name}
                      className="w-full bg-[#0f0f12] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-zinc-200 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
                      placeholder="Enter project name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500">
                      Description
                    </label>
                    <textarea
                      key={description}
                      defaultValue={description}
                      rows={4}
                      className="w-full bg-[#0f0f12] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-zinc-200 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none leading-relaxed"
                      placeholder="What is this project about?"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                <div className="space-y-1">
                  <h3 className="text-[14px] font-semibold text-zinc-200">Identifier</h3>
                  <p className="text-[12px] text-zinc-500 leading-relaxed">
                    This prefix is used for all issues within this project.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <div className="space-y-2 max-w-sm">
                    <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500">
                      Issue Prefix
                    </label>
                    <div className="relative group">
                      <input
                        type="text"
                        readOnly
                        value={key}
                        className="w-full bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-3 text-[14px] font-mono text-zinc-500 cursor-not-allowed"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded border border-white/[0.04]">
                        LOCKED
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Appearance Section */}
            <section ref={sections.appearance} className="space-y-8 pt-8">
              <div className="border-b border-white/[0.04] pb-6">
                <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Appearance</h2>
                <p className="text-[14px] text-zinc-500 mt-1">
                  Personalize the look and feel of your project space.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-1">
                  <h3 className="text-[14px] font-semibold text-zinc-200">Theme Color</h3>
                  <p className="text-[12px] text-zinc-500 leading-relaxed">
                    Select an accent color for project navigations and highlights.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <div className="flex flex-wrap gap-4">
                    {[
                      { name: "Indigo", color: "bg-indigo-500", selected: true },
                      { name: "Blue", color: "bg-blue-500" },
                      { name: "Emerald", color: "bg-emerald-500" },
                      { name: "Rose", color: "bg-rose-500" },
                      { name: "Amber", color: "bg-amber-500" },
                      { name: "Purple", color: "bg-purple-500" },
                    ].map((theme) => (
                      <button
                        key={theme.name}
                        className={`group p-1.5 rounded-full border-2 transition-all ${
                          theme.selected
                            ? "border-white/20"
                            : "border-transparent hover:border-white/10"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full ${theme.color} shadow-lg shadow-black/20`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Notifications Section */}
            <section ref={sections.notifications} className="space-y-8 pt-8">
              <div className="border-b border-white/[0.04] pb-6">
                <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Notifications</h2>
                <p className="text-[14px] text-zinc-500 mt-1">
                  Control how and when you get updated about project changes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-1">
                  <h3 className="text-[14px] font-semibold text-zinc-200">Channels</h3>
                  <p className="text-[12px] text-zinc-500 leading-relaxed">
                    Manage integrations and automated message delivery.
                  </p>
                </div>
                <div className="md:col-span-2 divide-y divide-white/[0.04]">
                  {[
                    "Email notifications for task updates",
                    "Slack integration alerts",
                    "Weekly digest summary",
                    "Real-time push notifications",
                  ].map((item, idx) => (
                    <div
                      key={item}
                      className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                    >
                      <span className="text-[14px] text-zinc-300 font-medium">{item}</span>
                      <button
                        className={`w-10 h-5.5 rounded-full relative transition-colors duration-200 outline-none ${
                          idx === 0 || idx === 3 ? "bg-blue-600" : "bg-zinc-800"
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-3.5 h-3.5 rounded-full bg-white transition-all transform ${
                            idx === 0 || idx === 3 ? "translate-x-5.5" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Danger Zone */}
            <section ref={sections.danger} className="space-y-8 pt-8 animate-pulse-subtle">
              <div className="border-b border-red-500/10 pb-6 text-red-400">
                <h2 className="text-2xl font-bold tracking-tight">Danger Zone</h2>
                <p className="text-[14px] text-red-500/60 mt-1">
                  Actions here are permanent and cannot be undone.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-red-500/[0.03] border border-red-500/10 flex flex-col md:flex-row items-center gap-8 shadow-[0_0_30px_rgba(239,68,68,0.02)]">
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-[16px] font-bold text-red-400 mb-2">Delete this project</h3>
                  <p className="text-[13px] text-zinc-500 leading-relaxed">
                    Removing this project will delete all associated tickets, sprints, and metrics.
                    This action is{" "}
                    <span className="text-red-400/80 font-bold italic">irreversible</span>.
                  </p>
                </div>
                <button
                  type="button"
                  className="px-6 py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[13px] font-bold rounded-xl border border-red-500/20 transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Project
                </button>
              </div>
            </section>

            <div className="h-20" />
          </div>
        </main>
      </div>
    </div>
  );
}
