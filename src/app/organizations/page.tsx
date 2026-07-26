"use client";

import Link from "next/link";
import { Plus, FolderKanban, ArrowRight } from "lucide-react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OrganizationCardsSkeleton } from "@/components/ui/skeleton";
import ThemeToggle from "@/components/layout/theme-toggle";

type Organization = {
  id: string;
  name: string;
};

function extractItems<T>(payload: T[] | { items?: T[] }) {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.items) ? payload.items : [];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchOrgs() {
      try {
        const res = await fetch("/api/organizations");
        if (res.ok) {
          const data = extractItems<Organization>(await res.json());
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

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-20">
        <div className="flex items-center justify-between mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-3 hover:opacity-80 transition-opacity no-underline"
          >
            <img
              src="/logo-icon.png"
              alt="SprintFlow"
              className="w-10 h-10 object-contain rounded-xl shadow-[0_0_24px_var(--color-accent-soft)]"
            />
            <span
              className="text-xl font-black tracking-tight text-fg"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              SprintFlow
            </span>
          </Link>
          <ThemeToggle />
        </div>

        {isLoading ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
              <div>
                <h1
                  className="text-3xl md:text-[2.5rem] font-extrabold tracking-[-0.03em] leading-tight text-fg"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  Your Organizations
                </h1>
                <p className="text-[var(--color-muted2)] mt-2 text-[0.95rem]">
                  Jump into a workspace or create something new.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/onboarding/workspace")}
                className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-bg bg-fg rounded-xl hover:bg-fg-strong transition-all shadow-lg active:scale-95 translate-y-[-4px]"
              >
                <Plus className="w-4 h-4" />
                New Organization
              </button>
            </div>
            <OrganizationCardsSkeleton count={6} />
          </>
        ) : orgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-20 h-20 bg-hover border border-border rounded-[2rem] flex items-center justify-center mb-8 shadow-lg">
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
              className="px-8 py-4 bg-fg text-bg rounded-2xl font-bold text-lg hover:bg-fg-strong transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl"
            >
              Create My First Organization
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
              <div>
                <h1
                  className="text-3xl md:text-[2.5rem] font-extrabold tracking-[-0.03em] leading-tight text-fg"
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
                className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-bg bg-fg rounded-xl hover:bg-fg-strong transition-all shadow-lg active:scale-95 translate-y-[-4px]"
              >
                <Plus className="w-4 h-4" />
                New Organization
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orgs.map((org) => (
                <Link key={org.id} href={`/organization/${org.id}`} className="block group">
                  <div className="relative h-full flex flex-col rounded-2xl bg-[var(--color-surface)] border border-border p-6 transition-all duration-300 hover:border-[var(--color-accent)]/30 hover:shadow-card-hover hover:-translate-y-1 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--color-accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />

                    <div className="flex items-start justify-between mb-6">
                      <div className="w-12 h-12 rounded-xl bg-hover border border-border flex items-center justify-center text-lg font-bold text-fg group-hover:bg-[var(--color-accent)]/10 group-hover:border-[var(--color-accent)]/20 transition-all">
                        {getInitials(org.name)}
                      </div>
                    </div>

                    <h2 className="text-xl font-bold tracking-tight text-fg mb-2 group-hover:text-fg-strong transition-colors">
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

                    <div className="mt-auto pt-5 border-t border-border flex items-center justify-between">
                      <div className="flex -space-x-2.5">
                        {["AB"].map((av, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-full border-2 border-[var(--color-surface)] bg-surface-2 flex items-center justify-center text-[10px] font-bold text-[var(--color-muted2)] shadow-lg"
                          >
                            {av}
                          </div>
                        ))}
                      </div>

                      <div className="w-10 h-10 rounded-xl bg-hover border border-border flex items-center justify-center group-hover:bg-[var(--color-accent)] group-hover:border-[var(--color-accent)] group-hover:shadow-[0_0_15px_var(--color-accent-soft)] transition-all">
                        <ArrowRight className="w-5 h-5 text-[var(--color-muted)] group-hover:text-fg-strong transition-colors" />
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
