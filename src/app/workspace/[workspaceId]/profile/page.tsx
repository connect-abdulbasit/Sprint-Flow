"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Building2,
  Camera,
  CheckCircle2,
  ChevronRight,
  FolderKanban,
  Info,
  LayoutDashboard,
  Loader2,
  Mail,
  Settings,
  Shield,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";

type ProfileUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  authProvider: string;
};

type WorkspaceSummary = {
  id: string;
  name: string;
  organizationId?: string;
  organizationName?: string;
};

function initialsFor(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

function authLabel(provider: string) {
  return provider === "google" ? "Google" : "Email & password";
}

export default function ProfilePage() {
  const params = useParams();
  const workspaceIdRaw = params.workspaceId;
  const workspaceId =
    typeof workspaceIdRaw === "string" ? workspaceIdRaw : (workspaceIdRaw?.[0] ?? "");
  const workspaceBase = workspaceId ? `/workspace/${workspaceId}` : "/organizations";

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [editName, setEditName] = useState("");
  const [orgCount, setOrgCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!workspaceId) return;
    void loadProfile();
  }, [workspaceId]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const [meRes, orgsRes, wsRes] = await Promise.all([
        fetch("/api/auth/me", { cache: "no-store" }),
        fetch("/api/organizations", { cache: "no-store" }),
        fetch(`/api/workspaces/${workspaceId}`, { cache: "no-store" }),
      ]);

      if (!meRes.ok) {
        setError("Couldn't load your profile. Please sign in again.");
        setUser(null);
        return;
      }

      const meData = (await meRes.json()) as { user?: ProfileUser | null };
      if (!meData.user) {
        setError("Couldn't load your profile. Please sign in again.");
        setUser(null);
        return;
      }

      setUser(meData.user);
      setEditName(meData.user.name);
      setIsDirty(false);

      let orgItems: Array<{ id: string; name: string }> = [];
      if (orgsRes.ok) {
        const orgsData = (await orgsRes.json()) as
          | Array<{ id: string; name: string }>
          | { items?: Array<{ id: string; name: string }> };
        orgItems = Array.isArray(orgsData) ? orgsData : (orgsData.items ?? []);
        setOrgCount(orgItems.length);
      }

      if (wsRes.ok) {
        const wsData = (await wsRes.json()) as {
          id: string;
          name: string;
          organizationId?: string;
        };

        const organizationName = wsData.organizationId
          ? orgItems.find((org) => org.id === wsData.organizationId)?.name
          : undefined;

        setWorkspace({
          id: wsData.id,
          name: wsData.name,
          organizationId: wsData.organizationId,
          organizationName,
        });
      }
    } catch {
      setError("Couldn't load your profile.");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!editName.trim()) {
      setToast({ message: "Name is required", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setToast({ message: errData.error ?? "Failed to save profile", type: "error" });
        return;
      }
      const data = (await res.json()) as { user: ProfileUser };
      setUser(data.user);
      setEditName(data.user.name);
      setIsDirty(false);
      setToast({ message: "Profile saved", type: "success" });
      window.dispatchEvent(new Event("sf-profile-updated"));
    } catch {
      setToast({ message: "Failed to save profile", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const cancelChanges = () => {
    if (!user) return;
    setEditName(user.name);
    setIsDirty(false);
  };

  const handleAvatarFile = async (file: File | undefined) => {
    if (!file) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/auth/me/avatar", { method: "POST", body: fd });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setToast({ message: errData.error ?? "Failed to upload photo", type: "error" });
        return;
      }
      const data = (await res.json()) as { user: ProfileUser };
      setUser(data.user);
      setToast({ message: "Profile photo updated", type: "success" });
      window.dispatchEvent(new Event("sf-profile-updated"));
    } catch {
      setToast({ message: "Failed to upload photo", type: "error" });
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const clearAvatar = async () => {
    setAvatarUploading(true);
    try {
      const res = await fetch("/api/auth/me/avatar", { method: "DELETE" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setToast({ message: errData.error ?? "Failed to remove photo", type: "error" });
        return;
      }
      const data = (await res.json()) as { user: ProfileUser };
      setUser(data.user);
      setToast({ message: "Profile photo removed", type: "success" });
      window.dispatchEvent(new Event("sf-profile-updated"));
    } catch {
      setToast({ message: "Failed to remove photo", type: "error" });
    } finally {
      setAvatarUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-surface-sunken min-h-0">
        <div className="h-44 border-b border-border bg-surface animate-pulse" />
        <div className="flex-1 px-6 py-10 lg:px-12">
          <div className="mx-auto max-w-6xl grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="h-72 rounded-2xl bg-hover-strong animate-pulse" />
            <div className="space-y-6">
              <div className="h-48 rounded-2xl bg-hover-strong animate-pulse" />
              <div className="h-40 rounded-2xl bg-hover-strong animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col h-full bg-surface-sunken items-center justify-center min-h-[50vh] text-center px-6">
        <div className="w-16 h-16 bg-danger/10 border border-danger/20 rounded-2xl flex items-center justify-center mb-6">
          <User className="w-8 h-8 text-danger" />
        </div>
        <h2 className="text-xl font-bold text-fg mb-2">Profile unavailable</h2>
        <p className="text-sm text-muted max-w-xs mb-8">
          {error ?? "Could not load your profile."}
        </p>
        <Link
          href={`${workspaceBase}/dashboard`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:opacity-80 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to dashboard
        </Link>
      </div>
    );
  }

  const displayName = editName.trim() || user.name;

  return (
    <div className="relative flex flex-col h-full bg-surface-sunken min-h-0">
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-[13px] font-medium shadow-dropdown backdrop-blur-md ${
            toast.type === "success"
              ? "border-success/25 bg-surface/95 text-success"
              : "border-danger/25 bg-surface/95 text-danger"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <X className="h-4 w-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      <header className="relative shrink-0 overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 bg-gradient-to-br from-accent/12 via-surface-sunken to-accent2/8"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, var(--color-accent-soft) 0%, transparent 45%), radial-gradient(circle at 80% 0%, var(--color-accent-soft) 0%, transparent 40%)",
          }}
          aria-hidden
        />

        <div className="relative px-6 py-6 lg:px-12 lg:py-8">
          <Link
            href={`${workspaceBase}/dashboard`}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-muted hover:text-accent transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            Back to dashboard
          </Link>

          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-5 min-w-0">
              <div className="relative shrink-0">
                <div className="rounded-full p-[3px] bg-gradient-to-br from-accent/50 via-accent/20 to-accent2/40 shadow-card">
                  <div className="rounded-full bg-surface-sunken p-[3px]">
                    <div className="relative h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-full border border-border bg-surface-2 flex items-center justify-center">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-3xl font-bold text-muted2">
                          {initialsFor(displayName)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted mb-1.5">
                  Your account
                </p>
                <h1
                  className="text-2xl sm:text-3xl font-bold tracking-tight text-fg truncate"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  {displayName}
                </h1>
                <p className="mt-1 text-[14px] text-muted truncate">{user.email}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {workspace && (
                    <>
                      {workspace.organizationName && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 px-2.5 py-1 text-[11px] font-medium text-muted2 backdrop-blur-sm">
                          <Building2 className="h-3 w-3 text-accent" />
                          {workspace.organizationName}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 px-2.5 py-1 text-[11px] font-medium text-muted2 backdrop-blur-sm">
                        <FolderKanban className="h-3 w-3 text-accent" />
                        {workspace.name}
                      </span>
                    </>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 px-2.5 py-1 text-[11px] font-medium text-muted2 backdrop-blur-sm">
                    <Shield className="h-3 w-3 text-accent" />
                    {authLabel(user.authProvider)}
                  </span>
                  {orgCount !== null && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 px-2.5 py-1 text-[11px] font-medium text-muted2 backdrop-blur-sm">
                      {orgCount} {orgCount === 1 ? "organization" : "organizations"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <Link
                href={`${workspaceBase}/settings`}
                className="inline-flex items-center gap-2 rounded-xl border border-border-hover bg-surface/80 px-4 py-2.5 text-[13px] font-medium text-fg hover:bg-hover backdrop-blur-sm cursor-pointer"
              >
                <Settings className="h-4 w-4 text-accent" />
                Workspace settings
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar px-6 py-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-6xl grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted mb-4">
                Sidebar preview
              </h2>
              <div className="rounded-xl border border-border bg-sidebar p-3">
                <div className="flex items-center gap-3 rounded-xl bg-hover-strong px-3 py-2.5">
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border bg-surface-2 flex items-center justify-center">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-muted2">
                        {initialsFor(displayName)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-fg">{displayName}</p>
                    <p className="truncate text-[11px] text-muted">{user.email}</p>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-muted">
                This is how teammates see you in the workspace sidebar.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted mb-4">
                Profile photo
              </h2>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={avatarUploading}
                onChange={(e) => void handleAvatarFile(e.target.files?.[0])}
              />

              <button
                type="button"
                disabled={avatarUploading}
                onClick={() => fileInputRef.current?.click()}
                className="group relative mx-auto mb-4 flex cursor-pointer disabled:opacity-70"
                aria-label="Change profile photo"
              >
                <div className="relative h-32 w-32 overflow-hidden rounded-full border border-border bg-surface-sunken flex items-center justify-center">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-muted2">
                      {initialsFor(displayName)}
                    </span>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-overlay opacity-0 transition-opacity group-hover:opacity-100">
                    {avatarUploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-fg-strong" />
                    ) : (
                      <Camera className="h-6 w-6 text-fg-strong" />
                    )}
                  </div>
                </div>
              </button>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={avatarUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border-hover px-4 py-2.5 text-[13px] font-medium text-fg hover:bg-hover disabled:opacity-50 cursor-pointer"
                >
                  {avatarUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {user.avatarUrl ? "Change photo" : "Upload photo"}
                </button>
                {user.avatarUrl && (
                  <button
                    type="button"
                    disabled={avatarUploading}
                    onClick={() => void clearAvatar()}
                    className="inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-[13px] font-medium text-muted2 hover:text-danger hover:bg-danger-soft/40 disabled:opacity-50 cursor-pointer"
                  >
                    Remove photo
                  </button>
                )}
              </div>
              <p className="mt-3 text-center text-[12px] text-muted">
                JPG, PNG, WebP, or GIF · max 2MB
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-gradient-to-br from-accent/5 to-accent2/5 p-5">
              <div className="flex items-center gap-2 text-accent mb-2">
                <Info className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Tip</span>
              </div>
              <p className="text-[12px] text-muted leading-relaxed">
                Profile changes apply everywhere in SprintFlow — tickets, comments, and the sidebar
                for {workspace?.name ?? "this workspace"}.
              </p>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-surface p-6 sm:p-7 shadow-card">
              <div className="border-b border-border pb-5 mb-6">
                <h2 className="text-xl font-bold tracking-tight text-fg">Account details</h2>
                <p className="mt-1 text-[14px] text-muted">
                  Update how your name appears across SprintFlow.
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="profile-name"
                    className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted"
                  >
                    Display name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                    <input
                      id="profile-name"
                      value={editName}
                      onChange={(e) => {
                        setEditName(e.target.value);
                        setIsDirty(e.target.value.trim() !== user.name);
                      }}
                      className="w-full rounded-xl border border-border bg-surface-sunken pl-10 pr-4 py-3 text-[14px] text-fg placeholder:text-muted outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15 transition-shadow"
                      placeholder="Your name"
                      maxLength={255}
                    />
                  </div>
                  <p className="text-[12px] text-muted">
                    Shown on tickets, comments, and member lists.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                    <input
                      value={user.email}
                      readOnly
                      className="w-full rounded-xl border border-border bg-surface-2 pl-10 pr-4 py-3 text-[14px] text-muted2 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[12px] text-muted">
                    Contact support to change your sign-in email.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-surface-sunken/60 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted mb-1">
                      Sign-in method
                    </p>
                    <p className="text-[14px] font-semibold text-fg">
                      {authLabel(user.authProvider)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-sunken/60 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted mb-1">
                      Account status
                    </p>
                    <p className="text-[14px] font-semibold text-success">Active</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted mb-4">
                Quick links
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href={`${workspaceBase}/dashboard`}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-surface-sunken/50 px-4 py-3.5 hover:border-border-hover hover:bg-hover transition-colors cursor-pointer"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
                    <LayoutDashboard className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-fg">Dashboard</p>
                    <p className="text-[12px] text-muted truncate">
                      Return to {workspace?.name ?? "workspace"}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted group-hover:text-accent transition-colors" />
                </Link>
                <Link
                  href={`${workspaceBase}/team`}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-surface-sunken/50 px-4 py-3.5 hover:border-border-hover hover:bg-hover transition-colors cursor-pointer"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-fg">Team</p>
                    <p className="text-[12px] text-muted truncate">View workspace members</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted group-hover:text-accent transition-colors" />
                </Link>
                <Link
                  href={`${workspaceBase}/settings`}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-surface-sunken/50 px-4 py-3.5 hover:border-border-hover hover:bg-hover transition-colors cursor-pointer"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
                    <Settings className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-fg">Workspace settings</p>
                    <p className="text-[12px] text-muted truncate">Manage this workspace</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted group-hover:text-accent transition-colors" />
                </Link>
                <Link
                  href="/organizations"
                  className="group flex items-center gap-3 rounded-xl border border-border bg-surface-sunken/50 px-4 py-3.5 hover:border-border-hover hover:bg-hover transition-colors cursor-pointer"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-fg">Organizations</p>
                    <p className="text-[12px] text-muted truncate">Switch org or workspace</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted group-hover:text-accent transition-colors" />
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>

      {isDirty && (
        <div className="absolute bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-border bg-surface/95 px-4 py-3 shadow-dropdown backdrop-blur-xl">
          <p className="hidden sm:block text-[13px] text-muted whitespace-nowrap">
            Unsaved changes
          </p>
          <button
            type="button"
            disabled={saving}
            onClick={cancelChanges}
            className="rounded-xl px-4 py-2 text-[13px] font-medium text-muted2 hover:bg-hover transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveProfile()}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save changes
          </button>
        </div>
      )}
    </div>
  );
}
