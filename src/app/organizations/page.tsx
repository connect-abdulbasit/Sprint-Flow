"use client";

import Link from "next/link";
import { Plus, Users, FolderKanban, ArrowRight } from "lucide-react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchOrgs() {
      try {
        const res = await fetch("/api/organizations");
        if (res.ok) {
          const data = await res.json();
          setOrgs(data);
        }
      } catch (err) {
        console.error("Failed to fetch orgs", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrgs();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[var(--color-accent)]/20 border-t-[var(--color-accent)] rounded-full animate-spin" />
          <p className="text-[var(--color-muted)] text-sm font-medium animate-pulse">
            Loading Organizations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[#f0f0f5]">
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-3 mb-12 hover:opacity-80 transition-opacity no-underline"
        >
          <img
            src="/logo-icon.png"
            alt="SprintFlow"
            className="w-10 h-10 object-contain rounded-xl shadow-[0_0_24px_rgba(79,124,255,0.15)]"
          />
          <span
            className="text-xl font-black tracking-tight text-[#f0f0f5]"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            SprintFlow
          </span>
        </Link>

        {orgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-20 h-20 bg-white/[0.03] border border-white/[0.08] rounded-[2rem] flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
              <Plus className="w-10 h-10 text-[var(--color-accent)]" />
            </div>
            <h1
              className="text-4xl font-extrabold tracking-tight mb-4"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              No Organizations Found
            </h1>
            <p className="text-[var(--color-muted2)] text-lg max-w-md mx-auto mb-10 leading-relaxed">
              You haven't been added to any organizations yet. Start by creating your own brand
              today.
            </p>
            <button
              onClick={() => router.push("/onboarding/workspace")}
              className="px-8 py-4 bg-[#f0f0f5] text-[var(--color-bg)] rounded-2xl font-bold text-lg hover:bg-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl"
            >
              Create My First Organization
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
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
              <button
                onClick={() => router.push("/onboarding/workspace")}
                className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-[var(--color-bg)] bg-[#f0f0f5] rounded-xl hover:bg-white transition-all shadow-lg active:scale-95 translate-y-[-4px]"
              >
                <Plus className="w-4 h-4" />
                New Organization
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orgs.map((org) => (
                <Link key={org.id} href={`/organization/${org.id}`} className="block group">
                  <div className="relative h-full flex flex-col rounded-2xl bg-[var(--color-surface)] border border-white/[0.06] p-6 transition-all duration-300 hover:border-[var(--color-accent)]/30 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)] hover:-translate-y-1 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--color-accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />

                    <div className="flex items-start justify-between mb-6">
                      <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-lg font-bold text-[#f0f0f5] group-hover:bg-[var(--color-accent)]/10 group-hover:border-[var(--color-accent)]/20 transition-all">
                        {getInitials(org.name)}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-accent)] bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 px-2.5 py-1.5 rounded-lg shadow-sm">
                        FREE
                      </span>
                    </div>

                    <h2 className="text-xl font-bold tracking-tight text-[#f0f0f5] mb-2 group-hover:text-white transition-colors">
                      {org.name}
                    </h2>
                    <p className="text-xs text-[var(--color-muted)] mb-6 font-medium">
                      Recently updated
                    </p>

                    <div className="flex items-center gap-6 text-xs font-semibold text-[var(--color-muted2)] mb-6">
                      <span className="flex items-center gap-2">
                        <FolderKanban className="w-4 h-4 text-[var(--color-accent)]" />
                        Live workspaces
                      </span>
                    </div>

                    <div className="mt-auto pt-5 border-t border-white/[0.05] flex items-center justify-between">
                      <div className="flex -space-x-2.5">
                        {["AB"].map((av, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-surface2)] flex items-center justify-center text-[10px] font-bold text-[var(--color-muted2)] shadow-lg"
                          >
                            {av}
                          </div>
                        ))}
                      </div>

                      <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center group-hover:bg-[var(--color-accent)] group-hover:border-[var(--color-accent)] group-hover:shadow-[0_0_15px_rgba(79,124,255,0.4)] transition-all">
                        <ArrowRight className="w-5 h-5 text-[var(--color-muted)] group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
