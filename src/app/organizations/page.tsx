"use client";

import Link from "next/link";
import { Plus, Users, FolderKanban, ArrowRight } from "lucide-react";

const organizations = [
  {
    id: "org-1",
    name: "Acme Corporation",
    initials: "AC",
    role: "Owner",
    plan: "Business",
    workspaceCount: 8,
    memberCount: 24,
    recentActivity: "Engineering workspace updated 2h ago",
    memberAvatars: ["AJ", "BS", "CD", "DP", "+20"],
  },
  {
    id: "org-2",
    name: "Stark Industries",
    initials: "SI",
    role: "Member",
    plan: "Enterprise",
    workspaceCount: 3,
    memberCount: 142,
    recentActivity: "R&D workspace updated 5h ago",
    memberAvatars: ["TN", "PP", "BW", "+139"],
  },
  {
    id: "org-3",
    name: "Personal Projects",
    initials: "PP",
    role: "Owner",
    plan: "Free",
    workspaceCount: 1,
    memberCount: 1,
    recentActivity: "Side projects workspace updated 1d ago",
    memberAvatars: ["AB"],
  },
];

export default function OrganizationsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[#f0f0f5]">
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-20">
        {/* Branding + Header */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent2)] flex items-center justify-center text-sm font-black text-white shadow-[0_0_24px_rgba(79,124,255,0.25)]">
            SF
          </div>
          <span
            className="text-xl font-black tracking-tight"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            SprintFlow
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-3xl md:text-[2.5rem] font-extrabold tracking-[-0.03em] leading-tight text-[#f0f0f5]"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Your Organizations
            </h1>
            <p className="text-[var(--color-muted2)] mt-2 text-[0.95rem]">
              Jump into a workspace or create something new.
            </p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[var(--color-bg)] bg-[#f0f0f5] rounded-xl hover:bg-white transition-colors shadow-sm whitespace-nowrap">
            <Plus className="w-4 h-4" />
            New Organization
          </button>
        </div>

        {/* Org Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {organizations.map((org) => (
            <Link key={org.id} href={`/organization/${org.id}`} className="block group">
              <div className="relative h-full flex flex-col rounded-2xl bg-[var(--color-surface)] border border-white/[0.06] p-5 transition-all duration-300 hover:border-white/[0.12] hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] hover:-translate-y-0.5">
                {/* Top row: avatar + role badge */}
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-surface2)] border border-white/[0.06] flex items-center justify-center text-base font-bold text-[#f0f0f5] group-hover:border-[var(--color-accent)]/30 transition-colors">
                    {org.initials}
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)] bg-white/[0.04] border border-white/[0.06] px-2 py-1 rounded-md">
                    {org.plan}
                  </span>
                </div>

                {/* Name + role */}
                <h2 className="text-lg font-bold tracking-tight text-[#f0f0f5] mb-1 group-hover:text-white transition-colors">
                  {org.name}
                </h2>
                <p className="text-xs text-[var(--color-muted)] mb-5">{org.recentActivity}</p>

                {/* Stats */}
                <div className="flex items-center gap-5 text-xs text-[var(--color-muted2)] mb-5">
                  <span className="flex items-center gap-1.5">
                    <FolderKanban className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                    {org.workspaceCount} workspaces
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[var(--color-accent2)]" />
                    {org.memberCount} members
                  </span>
                </div>

                {/* Footer: stacked avatars + enter arrow */}
                <div className="mt-auto pt-4 border-t border-white/[0.05] flex items-center justify-between">
                  {/* Stacked avatars */}
                  <div className="flex -space-x-2">
                    {org.memberAvatars.map((av, i) => (
                      <div
                        key={i}
                        className={`w-7 h-7 rounded-full border-2 border-[var(--color-surface)] flex items-center justify-center text-[9px] font-bold ${
                          av.startsWith("+")
                            ? "bg-[var(--color-surface2)] text-[var(--color-muted)]"
                            : "bg-[var(--color-surface2)] text-[var(--color-muted2)]"
                        }`}
                      >
                        {av}
                      </div>
                    ))}
                  </div>

                  <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center group-hover:bg-[var(--color-accent)]/10 group-hover:border-[var(--color-accent)]/20 transition-all">
                    <ArrowRight className="w-4 h-4 text-[var(--color-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
