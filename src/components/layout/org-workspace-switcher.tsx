"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useWorkspaceNav } from "@/contexts/workspace-nav-context";
import { readSelectedOrgId, writeWorkspaceIdForOrg } from "@/lib/workspace-prefs";
import CreateWorkspaceModal from "@/components/workspace/CreateWorkspaceModal";
import {
  ChevronDown,
  Check,
  Plus,
  Settings,
  ExternalLink,
  Building2,
  FolderKanban,
} from "lucide-react";

interface Organization {
  id: string;
  name: string;
  initials: string;
  role: string;
  gradient: string;
}

interface Workspace {
  id: string;
  name: string;
  color: string;
  logoUrl?: string | null;
  role?: string;
  memberCount: number;
}

interface ApiOrganizationRow {
  id: string;
  name: string;
  role?: string;
}

interface ApiWorkspaceRow {
  id: string;
  name: string;
  color: string | null;
  logoUrl?: string | null;
  organizationId: string;
  role?: string;
  memberCount?: number;
}

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

const GRADIENTS = [
  "from-[#4f7cff] to-[#7c5cff]",
  "from-[#ff6b6b] to-[#ff9f43]",
  "from-[#00d4aa] to-[#00b4d8]",
  "from-[#a259ff] to-[#ff6add]",
  "from-[#ff4f7c] to-[#ff8a4f]",
];

function getGradient(id: string) {
  const charSum = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return GRADIENTS[charSum % GRADIENTS.length];
}

function getOrganizationRoleLabel(role: string | null | undefined) {
  if (role === "owner") return "Org Owner";
  if (role === "admin") return "Org Admin";
  return "Org Member";
}

function getWorkspaceRoleLabel(role: string | null | undefined) {
  if (role === "admin") return "Admin";
  if (role === "project_manager") return "Project Manager";
  return "Member";
}

function WorkspaceMark({
  ws,
  variant,
}: {
  ws: Pick<Workspace, "color" | "logoUrl" | "name">;
  variant: "trigger" | "list";
}) {
  if (ws.logoUrl) {
    const cls =
      variant === "trigger"
        ? "w-4 h-4 rounded-md object-cover shrink-0 ring-1 ring-border-hover"
        : "w-7 h-7 rounded-lg object-cover shrink-0 ring-1 ring-border";
    return <img src={ws.logoUrl} alt="" className={cls} />;
  }
  const dot =
    variant === "trigger" ? "w-1.5 h-1.5 rounded-full shrink-0" : "w-2 h-2 rounded-full shrink-0";
  const shadow = variant === "trigger" ? `0 0 6px ${ws.color}` : `0 0 8px ${ws.color}40`;
  return (
    <div
      className={dot}
      style={{
        background: ws.color,
        boxShadow: shadow,
      }}
    />
  );
}

export default function OrgWorkspaceSwitcher({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { syncWorkspaceSelection, setNavWorkspaceId } = useWorkspaceNav();

  const [isOpen, setIsOpen] = useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [realOrganizations, setRealOrganizations] = useState<Organization[]>([]);
  const [realWorkspacesByOrg, setRealWorkspacesByOrg] = useState<Record<string, Workspace[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [orgsRes, wsRes] = await Promise.all([
          fetch("/api/organizations"),
          fetch("/api/workspaces"),
        ]);

        if (!orgsRes.ok || !wsRes.ok) throw new Error("Failed to fetch");

        const orgsPayload = (await orgsRes.json()) as
          | ApiOrganizationRow[]
          | { items?: ApiOrganizationRow[] };
        const wsPayload = (await wsRes.json()) as ApiWorkspaceRow[] | { items?: ApiWorkspaceRow[] };

        const orgsData = extractItems<ApiOrganizationRow>(orgsPayload);
        const wsData = extractItems<ApiWorkspaceRow>(wsPayload);

        const mappedOrgs = orgsData.map((org) => ({
          id: org.id,
          name: org.name,
          initials: getInitials(org.name),
          role: getOrganizationRoleLabel(org.role),
          gradient: getGradient(org.id),
        }));

        const wsByOrg: Record<string, Workspace[]> = {};
        wsData.forEach((ws) => {
          if (!wsByOrg[ws.organizationId]) wsByOrg[ws.organizationId] = [];
          wsByOrg[ws.organizationId].push({
            id: ws.id,
            name: ws.name,
            color: ws.color || "#4f7cff",
            logoUrl: ws.logoUrl ?? null,
            role: ws.role,
            // AUD-053: this used to be a hardcoded `1` for every workspace; the API now
            // returns a real member count.
            memberCount: ws.memberCount ?? 1,
          });
        });

        if (mappedOrgs.length > 0) {
          setRealOrganizations(mappedOrgs);
          setRealWorkspacesByOrg(wsByOrg);

          const path = typeof window !== "undefined" ? window.location.pathname : "";
          const pathOrgMatch = path.match(/^\/organization\/([^/]+)/);
          const pathOrgId = pathOrgMatch?.[1];
          const storedOrgId = readSelectedOrgId();
          const firstOrgId = mappedOrgs[0].id;

          let resolvedOrgId = pathOrgId ?? "";
          if (!resolvedOrgId || !mappedOrgs.some((o: Organization) => o.id === resolvedOrgId)) {
            resolvedOrgId =
              storedOrgId && mappedOrgs.some((o: Organization) => o.id === storedOrgId)
                ? storedOrgId
                : firstOrgId;
          }

          setSelectedOrgId(resolvedOrgId);
          const workspaces = wsByOrg[resolvedOrgId] ?? [];
          syncWorkspaceSelection(resolvedOrgId, workspaces);
        }
      } catch (err) {
        console.error("Error fetching orgs/workspaces:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [syncWorkspaceSelection]);

  // Extracted so both the dropdown-open refresh and a newly-created workspace (AUD-018)
  // can reuse the same fetch-and-map logic instead of duplicating it.
  const fetchWorkspacesByOrg = useCallback(async (): Promise<Record<
    string,
    Workspace[]
  > | null> => {
    try {
      const wsRes = await fetch("/api/workspaces");
      if (!wsRes.ok) return null;
      const wsPayload = (await wsRes.json()) as ApiWorkspaceRow[] | { items?: ApiWorkspaceRow[] };
      const wsData = extractItems<ApiWorkspaceRow>(wsPayload);

      const wsByOrg: Record<string, Workspace[]> = {};
      wsData.forEach((ws) => {
        if (!wsByOrg[ws.organizationId]) wsByOrg[ws.organizationId] = [];
        wsByOrg[ws.organizationId].push({
          id: ws.id,
          name: ws.name,
          color: ws.color || "#4f7cff",
          logoUrl: ws.logoUrl ?? null,
          role: ws.role,
          // AUD-053: this used to be a hardcoded `1` for every workspace; the API now
          // returns a real member count.
          memberCount: ws.memberCount ?? 1,
        });
      });
      return wsByOrg;
    } catch (err) {
      console.error("Error fetching workspaces:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen || isLoading) return;

    let cancelled = false;
    fetchWorkspacesByOrg().then((wsByOrg) => {
      if (cancelled || !wsByOrg) return;
      setRealWorkspacesByOrg(wsByOrg);
      const workspaces = wsByOrg[selectedOrgId] ?? [];
      syncWorkspaceSelection(selectedOrgId, workspaces);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, isLoading, selectedOrgId, syncWorkspaceSelection, fetchWorkspacesByOrg]);

  const handleWorkspaceCreated = useCallback(async () => {
    const wsByOrg = await fetchWorkspacesByOrg();
    if (!wsByOrg) return;
    setRealWorkspacesByOrg(wsByOrg);
    const workspaces = wsByOrg[selectedOrgId] ?? [];
    syncWorkspaceSelection(selectedOrgId, workspaces);
  }, [fetchWorkspacesByOrg, selectedOrgId, syncWorkspaceSelection]);

  useEffect(() => {
    if (isLoading || realOrganizations.length === 0) return;
    const m = pathname.match(/^\/organization\/([^/]+)/);
    if (!m?.[1]) return;
    const orgIdFromPath = m[1];
    if (!realOrganizations.some((o) => o.id === orgIdFromPath)) return;
    setSelectedOrgId(orgIdFromPath);
    const workspaces = realWorkspacesByOrg[orgIdFromPath] ?? [];
    syncWorkspaceSelection(orgIdFromPath, workspaces);
  }, [isLoading, pathname, realOrganizations, realWorkspacesByOrg, syncWorkspaceSelection]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (isLoading) {
    return (
      <div
        className={`px-4 py-4 border-b border-border-strong ${isCollapsed ? "flex justify-center" : ""}`}
      >
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-9 h-9 rounded-xl bg-hover" />
          {!isCollapsed && (
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-hover rounded" />
              <div className="h-2 w-16 bg-hover rounded" />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (realOrganizations.length === 0) {
    return (
      <div className="px-4 py-4 border-b border-border-strong">
        <button
          onClick={() => router.push("/onboarding/workspace")}
          className={`group flex items-center gap-3 w-full rounded-xl transition-all duration-200 hover:bg-[var(--color-accent)]/10 p-2.5 border border-dashed border-border-strong hover:border-[var(--color-accent)]/50 ${
            isCollapsed ? "justify-center p-2" : ""
          }`}
          title="Setup Organization"
        >
          <div className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center text-[var(--color-accent)] shrink-0 transition-transform duration-200 group-hover:scale-110">
            <Plus className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="text-left overflow-hidden">
              <div className="text-[13px] font-bold text-fg truncate leading-tight">
                Setup Organization
              </div>
              <div className="text-[10px] text-muted mt-0.5">Click to begin</div>
            </div>
          )}
        </button>
      </div>
    );
  }

  const displayOrganizations = realOrganizations;
  const displayWorkspacesByOrg = realWorkspacesByOrg;

  const currentOrgId = selectedOrgId || displayOrganizations[0]?.id;
  const selectedOrg =
    displayOrganizations.find((o) => o.id === currentOrgId) ?? displayOrganizations[0];
  const workspaces = displayWorkspacesByOrg[currentOrgId] ?? [];

  const workspaceMatch = pathname.match(/^\/workspace\/([^/]+)/);
  const currentWorkspaceId = workspaceMatch ? workspaceMatch[1] : null;
  const currentWorkspace = workspaces.find((ws) => ws.id === currentWorkspaceId);

  const handleWorkspaceSelect = (wsId: string) => {
    writeWorkspaceIdForOrg(currentOrgId, wsId);
    setNavWorkspaceId(wsId);
    const onProfile = /\/profile\/?$/.test(pathname);
    router.push(onProfile ? `/workspace/${wsId}/profile` : `/workspace/${wsId}/dashboard`);
    setIsOpen(false);
  };

  const handleOrgSelect = (orgId: string) => {
    setSelectedOrgId(orgId);
    const list = displayWorkspacesByOrg[orgId] ?? [];
    syncWorkspaceSelection(orgId, list);
  };

  const trigger = (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={`group flex items-center gap-3 w-full rounded-xl transition-all duration-200 hover:bg-hover active:scale-[0.98] ${
        isCollapsed ? "justify-center p-2" : "p-2.5"
      } ${isOpen ? "bg-hover" : ""}`}
      title={isCollapsed ? `${selectedOrg.name}` : undefined}
    >
      <div
        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${selectedOrg.gradient} flex items-center justify-center text-[11px] font-black text-white shrink-0 shadow-glow transition-transform duration-200 group-hover:scale-105`}
      >
        {selectedOrg.initials}
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-hidden text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold truncate text-fg leading-tight">
              {selectedOrg.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {currentWorkspace && (
              <>
                <WorkspaceMark ws={currentWorkspace} variant="trigger" />
                <span className="text-[11px] text-muted2 truncate">{currentWorkspace.name}</span>
                <span className="text-[11px] text-muted">•</span>
                <span className="text-[11px] text-muted truncate">
                  {getWorkspaceRoleLabel(currentWorkspace.role)}
                </span>
              </>
            )}
            {!currentWorkspace && (
              <span className="text-[11px] text-muted truncate">Select workspace</span>
            )}
          </div>
        </div>
      )}

      {!isCollapsed && (
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      )}
    </button>
  );

  const dropdown = isOpen && (
    <div
      className={`absolute z-[100] mt-1.5 rounded-2xl border border-border bg-surface/95 backdrop-blur-2xl shadow-dropdown overflow-hidden animate-in ${
        isCollapsed ? "left-full ml-2 top-0 w-[300px]" : "left-0 right-0 w-full min-w-[280px]"
      }`}
      style={{
        animation: "switcher-open 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div className="px-3 pt-3 pb-1.5">
        <div className="flex items-center gap-1.5 px-2 mb-2">
          <Building2 className="w-3 h-3 text-muted" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
            Organizations
          </span>
        </div>
        <div className="space-y-0.5">
          {displayOrganizations.map((org) => {
            const isSelected = org.id === currentOrgId;
            return (
              <button
                key={org.id}
                onClick={() => handleOrgSelect(org.id)}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-all duration-150 ${
                  isSelected
                    ? "bg-hover-strong text-fg"
                    : "text-muted2 hover:bg-hover hover:text-fg"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg bg-gradient-to-br ${org.gradient} flex items-center justify-center text-[9px] font-black text-white shrink-0`}
                >
                  {org.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[12.5px] font-semibold truncate block leading-tight">
                    {org.name}
                  </span>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-3 border-t border-border" />

      <div className="px-3 pt-2.5 pb-1.5">
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-1.5">
            <FolderKanban className="w-3 h-3 text-muted" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
              Workspaces
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              // AUD-018: this button previously had no onClick at all — the most
              // discoverable "create workspace" affordance in the app did nothing.
              setIsOpen(false);
              setCreateWorkspaceOpen(true);
            }}
            disabled={!selectedOrgId}
            className="w-5 h-5 flex items-center justify-center rounded-md text-muted hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-all duration-150 disabled:pointer-events-none disabled:opacity-40"
            title="New workspace"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-0.5">
          {workspaces.map((ws) => {
            const isActive = ws.id === currentWorkspaceId;
            return (
              <button
                key={ws.id}
                onClick={() => handleWorkspaceSelect(ws.id)}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-all duration-150 ${
                  isActive ? "bg-hover-strong text-fg" : "text-muted2 hover:bg-hover hover:text-fg"
                }`}
              >
                <WorkspaceMark ws={ws} variant="list" />
                <div className="flex-1 min-w-0">
                  <span className="text-[12.5px] font-medium truncate block leading-tight">
                    {ws.name}
                  </span>
                  <span className="text-[10px] text-muted truncate">
                    {getWorkspaceRoleLabel(ws.role)}
                  </span>
                </div>
                <span className="text-[10px] text-muted tabular-nums shrink-0">
                  {ws.memberCount} {ws.memberCount === 1 ? "member" : "members"}
                </span>
                {isActive && <Check className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-3 border-t border-border" />
      <div className="px-3 py-2 flex items-center gap-1">
        <Link
          href="/organizations"
          onClick={() => setIsOpen(false)}
          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted hover:text-fg hover:bg-hover transition-all duration-150"
        >
          <ExternalLink className="w-3 h-3" />
          Manage orgs
        </Link>
        <div className="w-px h-3.5 bg-border" />
        <Link
          href={`/organization/${selectedOrgId}`}
          onClick={() => setIsOpen(false)}
          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted hover:text-fg hover:bg-hover transition-all duration-150"
        >
          <Settings className="w-3 h-3" />
          Org settings
        </Link>
      </div>
    </div>
  );

  return (
    <div ref={dropdownRef} className="relative px-4 py-4 border-b border-border-strong">
      {trigger}
      {dropdown}

      <style jsx>{`
        @keyframes switcher-open {
          0% {
            opacity: 0;
            transform: translateY(-6px) scale(0.97);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      {selectedOrgId && (
        <CreateWorkspaceModal
          isOpen={createWorkspaceOpen}
          onClose={() => setCreateWorkspaceOpen(false)}
          organizationId={selectedOrgId}
          onSuccess={() => {
            void handleWorkspaceCreated();
          }}
        />
      )}
    </div>
  );
}
