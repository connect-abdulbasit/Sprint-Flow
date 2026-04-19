"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Hexagon, ArrowRight } from "lucide-react";

export default function CreateWorkspacePage() {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [isOrgFocused, setIsOrgFocused] = useState(false);
  const [isWsFocused, setIsWsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-generate slug (to lowercase, replace spaces with hyphens)
  const slug = workspaceName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName.trim() || !workspaceName.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: organizationName,
          workspaceName: workspaceName,
          workspaceSlug: slug,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create workspace");
      }

      const { workspace } = await res.json();
      router.push(`/workspace/${workspace.id}/dashboard`);
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };

  const currentDomain = "sprintflow.com";

  return (
    <div className="w-full max-w-3xl flex flex-col items-center animate-fade-up">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-[#18181f] border border-[#333339] text-xs font-semibold tracking-wide text-[#9090a8] uppercase mx-auto">
          Step 1 of 3
        </div>
      </div>

      <div className="flex flex-col md:flex-row bg-[#111118] rounded-3xl shadow-2xl border border-[#333339] overflow-hidden w-full">
        {/* Main Form Area */}
        <div className="flex-1 p-8 md:p-12">
          {/* Header */}
          <div className="mb-8">
            <div className="h-12 w-12 bg-[#18181f] rounded-xl flex items-center justify-center mb-6 border border-[var(--color-accent)]/20 shadow-[0_0_15px_rgba(79,124,255,0.15)] overflow-hidden">
              <img src="/logo-icon.png" alt="SprintFlow" className="h-7 w-7 object-contain" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#f0f0f5] mb-2 font-syne">
              Set Up Your Brand
            </h1>
            <p className="text-[#9090a8] text-sm leading-relaxed">
              Define your organization and choose your first workspace to start sprinting.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleContinue} className="space-y-6">
            {/* Workspace Auto-Avatar / Upload */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-[#18181f] border border-[#333339] border-dashed rounded-xl flex items-center justify-center text-[#6b6b80] cursor-pointer hover:bg-[#1f1f27] hover:border-[#4f7cff] transition-colors group">
                {workspaceName ? (
                  <span className="text-xl font-bold text-[#f0f0f5] group-hover:hidden uppercase">
                    {workspaceName.charAt(0)}
                  </span>
                ) : (
                  <span className="text-xl font-bold text-[#6b6b80] group-hover:hidden">?</span>
                )}
                <Upload className="h-5 w-5 hidden group-hover:block text-[#9090a8]" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-[#f0f0f5]">Workspace Logo</p>
                <p className="text-[#6b6b80] text-xs mt-0.5">Optional. JPG, PNG up to 2MB.</p>
              </div>
            </div>

            {/* Organization Name Input */}
            <div>
              <label
                htmlFor="organizationName"
                className="block text-sm font-medium text-[#f0f0f5] mb-2"
              >
                Organization Name
              </label>
              <div
                className={`flex items-center rounded-xl border transition-all duration-200 bg-[#18181f] ${
                  isOrgFocused
                    ? "border-[#4f7cff] ring-1 ring-[#4f7cff]"
                    : "border-[#333339] hover:border-[#4f7cff]/50"
                }`}
              >
                <input
                  id="organizationName"
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  onFocus={() => setIsOrgFocused(true)}
                  onBlur={() => setIsOrgFocused(false)}
                  placeholder="e.g. Stark Industries"
                  className="w-full bg-transparent px-4 py-3 text-[#f0f0f5] placeholder-[#6b6b80] outline-none text-base font-medium rounded-xl"
                />
              </div>
            </div>

            {/* Workspace Name Input */}
            <div>
              <label
                htmlFor="workspaceName"
                className="block text-sm font-medium text-[#f0f0f5] mb-2"
              >
                First Workspace Name
              </label>
              <div
                className={`flex items-center rounded-xl border transition-all duration-200 bg-[#18181f] ${
                  isWsFocused
                    ? "border-[#4f7cff] ring-1 ring-[#4f7cff]"
                    : "border-[#333339] hover:border-[#4f7cff]/50"
                }`}
              >
                <input
                  id="workspaceName"
                  type="text"
                  required
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  onFocus={() => setIsWsFocused(true)}
                  onBlur={() => setIsWsFocused(false)}
                  placeholder="e.g. Engineering"
                  className="w-full bg-transparent px-4 py-3 text-[#f0f0f5] placeholder-[#6b6b80] outline-none text-base font-medium rounded-xl"
                />
              </div>

              {/* URL Preview */}
              <div className="mt-3 flex items-start gap-2 bg-[#18181f] rounded-lg p-3 border border-[#333339]">
                <div className="text-[#6b6b80] mt-0.5">
                  <Hexagon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#9090a8]">First workspace URL:</p>
                  <p className="text-sm text-[#f0f0f5] font-mono mt-0.5 break-all">
                    {currentDomain}/
                    <span className="text-[#4f7cff] font-semibold">{slug || "workspace-name"}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => router.push("/onboarding/invite")}
                className="text-sm font-medium text-[#9090a8] hover:text-[#f0f0f5] px-4 py-2 transition-colors"
              >
                Go back
              </button>
              <button
                type="submit"
                disabled={!workspaceName.trim() || !organizationName.trim() || isLoading}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all duration-200 ${
                  workspaceName.trim() && organizationName.trim() && !isLoading
                    ? "bg-[#4f7cff] hover:opacity-90 text-white shadow-[0_2px_10px_rgb(79,124,255,0.3)] hover:shadow-[0_4px_15px_rgb(79,124,255,0.4)] transform hover:-translate-y-0.5"
                    : "bg-[#18181f] text-[#6b6b80] cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Workspace <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Optional Sidebar Area (Informational) */}
        <div className="hidden md:flex flex-col bg-[#111118] border-l border-[#333339] w-64 p-8 justify-center">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[#f0f0f5] mb-2 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4f7cff]/20 text-[#4f7cff] text-[10px]">
                  1
                </span>
                Create Workspaces
              </h3>
              <p className="text-xs text-[#9090a8] leading-relaxed">
                Workspaces contain all your projects, boards, and team members in one isolated
                environment.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#f0f0f5] mb-2 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#18181f] text-[#6b6b80] text-[10px]">
                  2
                </span>
                Invite Members
              </h3>
              <p className="text-xs text-[#9090a8] leading-relaxed">
                You can invite your team now or do it later from your workspace settings securely.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#f0f0f5] mb-2 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#18181f] text-[#6b6b80] text-[10px]">
                  3
                </span>
                Start Sprinting
              </h3>
              <p className="text-xs text-[#9090a8] leading-relaxed">
                Plan your first sprint, assign tasks, and ship faster together with no friction.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
