"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Hexagon, ArrowRight, Check, X, Loader2 } from "lucide-react";

type SlugStatus = "idle" | "checking" | "available" | "taken";

export default function CreateWorkspacePage() {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [isOrgFocused, setIsOrgFocused] = useState(false);
  const [isWsFocused, setIsWsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const slug = workspaceName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Debounced live availability check so a taken URL is caught before submitting,
  // rather than only after the backend rejects the create request.
  useEffect(() => {
    if (!slug) {
      setSlugStatus("idle");
      return;
    }

    setSlugStatus("checking");
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/workspaces/slug-available?slug=${encodeURIComponent(slug)}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          setSlugStatus("idle");
          return;
        }
        const data = (await res.json()) as { available: boolean };
        setSlugStatus(data.available ? "available" : "taken");
      } catch (err) {
        if ((err as Error).name !== "AbortError") setSlugStatus("idle");
      }
    }, 400);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [slug]);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName.trim() || !workspaceName.trim()) return;
    if (slugStatus === "taken") {
      setError("This workspace URL is already taken. Please choose another.");
      return;
    }

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

      const { workspace } = (await res.json()) as { workspace: { id: string } };

      if (logoFile) {
        const fd = new FormData();
        fd.append("file", logoFile);
        await fetch(`/api/workspaces/${workspace.id}/logo`, {
          method: "POST",
          body: fd,
        }).catch(() => {});
      }

      // AUD-014: this used to skip straight to the dashboard, which meant the "Invite
      // Your Team" step (onboarding/invite) was only ever reachable via a mislabeled
      // "Go back" button *before* a workspace existed — so it had no workspaceId to send
      // real invites against. Routing here now makes it the actual next step, with a
      // real workspace to invite people into.
      router.push(
        `/onboarding/invite?workspaceId=${workspace.id}&workspaceName=${encodeURIComponent(workspaceName)}`
      );
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };

  const currentDomain = "sprintflow.com";

  return (
    <div className="w-full max-w-3xl flex flex-col items-center animate-fade-up">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-surface-2 border border-border-strong text-xs font-semibold tracking-wide text-muted2 uppercase mx-auto">
          Step 1 of 3
        </div>
      </div>

      <div className="flex flex-col md:flex-row bg-surface rounded-3xl shadow-2xl border border-border-strong overflow-hidden w-full">
        {/* Main Form Area */}
        <div className="flex-1 p-8 md:p-12">
          {/* Header */}
          <div className="mb-8">
            <div className="h-12 w-12 bg-surface-2 rounded-xl flex items-center justify-center mb-6 border border-[var(--color-accent)]/20 shadow-[0_0_15px_var(--color-accent-soft)] overflow-hidden">
              <img src="/logo-icon.png" alt="SprintFlow" className="h-7 w-7 object-contain" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-fg mb-2 font-syne">
              Set Up Your Brand
            </h1>
            <p className="text-muted2 text-sm leading-relaxed">
              Define your organization and choose your first workspace to start sprinting.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-medium animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleContinue} className="space-y-6">
            {/* Workspace Auto-Avatar / Upload */}
            <div className="flex items-center gap-4">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setLogoFile(f ?? null);
                }}
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="h-16 w-16 bg-surface-2 border border-border-strong border-dashed rounded-xl flex items-center justify-center text-muted cursor-pointer hover:bg-surface-hover hover:border-accent transition-colors group overflow-hidden shrink-0"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="" className="h-full w-full object-cover" />
                ) : workspaceName ? (
                  <span className="text-xl font-bold text-fg group-hover:hidden uppercase">
                    {workspaceName.charAt(0)}
                  </span>
                ) : (
                  <span className="text-xl font-bold text-muted group-hover:hidden">?</span>
                )}
                {!logoPreview && (
                  <Upload className="h-5 w-5 hidden group-hover:block text-muted2" />
                )}
              </button>
              <div className="text-sm">
                <p className="font-medium text-fg">Workspace Logo</p>
                <p className="text-muted text-xs mt-0.5">
                  Optional. JPG, PNG, WebP, or GIF up to 2MB.
                </p>
                {logoFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setLogoFile(null);
                      if (logoInputRef.current) logoInputRef.current.value = "";
                    }}
                    className="text-[11px] text-accent hover:underline mt-1"
                  >
                    Clear image
                  </button>
                )}
              </div>
            </div>

            {/* Organization Name Input */}
            <div>
              <label htmlFor="organizationName" className="block text-sm font-medium text-fg mb-2">
                Organization Name
              </label>
              <div
                className={`flex items-center rounded-xl border transition-all duration-200 bg-surface-2 ${
                  isOrgFocused
                    ? "border-accent ring-1 ring-accent"
                    : "border-border-strong hover:border-accent/50"
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
                  className="w-full bg-transparent px-4 py-3 text-fg placeholder:text-muted outline-none text-base font-medium rounded-xl"
                />
              </div>
            </div>

            {/* Workspace Name Input */}
            <div>
              <label htmlFor="workspaceName" className="block text-sm font-medium text-fg mb-2">
                First Workspace Name
              </label>
              <div
                className={`flex items-center rounded-xl border transition-all duration-200 bg-surface-2 ${
                  isWsFocused
                    ? "border-accent ring-1 ring-accent"
                    : "border-border-strong hover:border-accent/50"
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
                  className="w-full bg-transparent px-4 py-3 text-fg placeholder:text-muted outline-none text-base font-medium rounded-xl"
                />
              </div>

              {/* URL Preview */}
              <div
                className={`mt-3 flex items-start gap-2 bg-surface-2 rounded-lg p-3 border transition-colors ${
                  slugStatus === "taken"
                    ? "border-danger/40"
                    : slugStatus === "available"
                      ? "border-success/40"
                      : "border-border-strong"
                }`}
              >
                <div className="text-muted mt-0.5">
                  <Hexagon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted2">First workspace URL:</p>
                  <p className="text-sm text-fg font-mono mt-0.5 break-all">
                    {currentDomain}/
                    <span className="text-accent font-semibold">{slug || "workspace-name"}</span>
                  </p>
                  {slug && slugStatus === "checking" && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Checking availability…
                    </p>
                  )}
                  {slug && slugStatus === "available" && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-success">
                      <Check className="h-3 w-3" />
                      This URL is available.
                    </p>
                  )}
                  {slug && slugStatus === "taken" && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-danger">
                      <X className="h-3 w-3" />
                      This URL is already taken. Please choose another.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex items-center justify-end gap-4">
              <button
                type="submit"
                disabled={
                  !workspaceName.trim() ||
                  !organizationName.trim() ||
                  isLoading ||
                  slugStatus === "taken" ||
                  slugStatus === "checking"
                }
                className={`px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all duration-200 ${
                  workspaceName.trim() &&
                  organizationName.trim() &&
                  !isLoading &&
                  slugStatus !== "taken" &&
                  slugStatus !== "checking"
                    ? "bg-accent hover:opacity-90 text-white shadow-[0_2px_10px_var(--color-accent-soft)] hover:shadow-[0_4px_15px_var(--color-accent-soft)] transform hover:-translate-y-0.5"
                    : "bg-surface-2 text-muted cursor-not-allowed"
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
        <div className="hidden md:flex flex-col bg-surface border-l border-border-strong w-64 p-8 justify-center">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-fg mb-2 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-accent text-[10px]">
                  1
                </span>
                Create Workspaces
              </h3>
              <p className="text-xs text-muted2 leading-relaxed">
                Workspaces contain all your projects, boards, and team members in one isolated
                environment.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-fg mb-2 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-2 text-muted text-[10px]">
                  2
                </span>
                Invite Members
              </h3>
              <p className="text-xs text-muted2 leading-relaxed">
                You can invite your team now or do it later from your workspace settings securely.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-fg mb-2 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-2 text-muted text-[10px]">
                  3
                </span>
                Start Sprinting
              </h3>
              <p className="text-xs text-muted2 leading-relaxed">
                Plan your first sprint, assign tasks, and ship faster together with no friction.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
