"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useWorkspaceNav } from "@/contexts/workspace-nav-context";
import { readSelectedOrgId, writeWorkspaceIdForOrg } from "@/lib/workspace-prefs";
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
  taskCount: number;
  memberCount: number;
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

export default function OrgWorkspaceSwitcher({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { syncWorkspaceSelection, setNavWorkspaceId } = useWorkspaceNav();

  const [isOpen, setIsOpen] = useState(false);
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

        const orgsData = await orgsRes.json();
        const wsData = await wsRes.json();

        const mappedOrgs = orgsData.map((org: { id: string; name: string }) => ({
          id: org.id,
          name: org.name,
          initials: getInitials(org.name),
          role: "Owner",
          gradient: getGradient(org.id),
        }));

        const wsByOrg: Record<string, Workspace[]> = {};
        wsData.forEach(
          (ws: { id: string; name: string; color: string | null; organizationId: string }) => {
            if (!wsByOrg[ws.organizationId]) wsByOrg[ws.organizationId] = [];
            wsByOrg[ws.organizationId].push({
              id: ws.id,
              name: ws.name,
              color: ws.color || "#4f7cff",
              taskCount: 0,
              memberCount: 1,
            });
          }
        );

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

  // ── Global Event Listeners (Hooks must be above returns) ──

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
        className={`px-4 py-4 border-b border-[#333339] ${isCollapsed ? "flex justify-center" : ""}`}
      >
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-9 h-9 rounded-xl bg-white/[0.05]" />
          {!isCollapsed && (
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-white/[0.05] rounded" />
              <div className="h-2 w-16 bg-white/[0.05] rounded" />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (realOrganizations.length === 0) {
    return (
      <div className="px-4 py-4 border-b border-[#333339]">
        <button
          onClick={() => router.push("/onboarding/workspace")}
          className={`group flex items-center gap-3 w-full rounded-xl transition-all duration-200 hover:bg-[var(--color-accent)]/10 p-2.5 border border-dashed border-[#333339] hover:border-[var(--color-accent)]/50 ${
            isCollapsed ? "justify-center p-2" : ""
          }`}
          title="Setup Organization"
        >
          <div className="w-9 h-9 rounded-xl bg-[#18181f] flex items-center justify-center text-[var(--color-accent)] shrink-0 transition-transform duration-200 group-hover:scale-110">
            <Plus className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="text-left overflow-hidden">
              <div className="text-[13px] font-bold text-[#f0f0f5] truncate leading-tight">
                Setup Organization
              </div>
              <div className="text-[10px] text-[#6b6b80] mt-0.5">Click to begin</div>
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
    router.push(`/workspace/${wsId}/dashboard`);
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
      className={`group flex items-center gap-3 w-full rounded-xl transition-all duration-200 hover:bg-white/[0.05] active:scale-[0.98] ${
        isCollapsed ? "justify-center p-2" : "p-2.5"
      } ${isOpen ? "bg-white/[0.05]" : ""}`}
      title={isCollapsed ? `${selectedOrg.name}` : undefined}
    >
      <div
        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${selectedOrg.gradient} flex items-center justify-center text-[11px] font-black text-white shrink-0 shadow-[0_2px_12px_rgba(79,124,255,0.25)] transition-transform duration-200 group-hover:scale-105`}
      >
        {selectedOrg.initials}
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-hidden text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold truncate text-[#f0f0f5] leading-tight">
              {selectedOrg.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {currentWorkspace && (
              <>
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    background: currentWorkspace.color,
                    boxShadow: `0 0 6px ${currentWorkspace.color}`,
                  }}
                />
                <span className="text-[11px] text-[#8888a0] truncate">{currentWorkspace.name}</span>
              </>
            )}
            {!currentWorkspace && (
              <span className="text-[11px] text-[#6b6b80] truncate">Select workspace</span>
            )}
          </div>
        </div>
      )}

      {!isCollapsed && (
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#6b6b80] shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      )}
    </button>
  );

  const dropdown = isOpen && (
    <div
      className={`absolute z-[100] mt-1.5 rounded-2xl border border-white/[0.08] bg-[#16161e]/95 backdrop-blur-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)] overflow-hidden animate-in ${
        isCollapsed ? "left-full ml-2 top-0 w-[300px]" : "left-0 right-0 w-full min-w-[280px]"
      }`}
      style={{
        animation: "switcher-open 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div className="px-3 pt-3 pb-1.5">
        <div className="flex items-center gap-1.5 px-2 mb-2">
          <Building2 className="w-3 h-3 text-[#6b6b80]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6b6b80]">
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
                    ? "bg-white/[0.07] text-[#f0f0f5]"
                    : "text-[#9090a8] hover:bg-white/[0.04] hover:text-[#d0d0db]"
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
                  <span className="text-[10px] text-[#6b6b80]">{org.role}</span>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-3 border-t border-white/[0.06]" />

      <div className="px-3 pt-2.5 pb-1.5">
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-1.5">
            <FolderKanban className="w-3 h-3 text-[#6b6b80]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6b6b80]">
              Workspaces
            </span>
          </div>
          <button
            className="w-5 h-5 flex items-center justify-center rounded-md text-[#6b6b80] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-all duration-150"
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
                  isActive
                    ? "bg-white/[0.07] text-[#f0f0f5]"
                    : "text-[#9090a8] hover:bg-white/[0.04] hover:text-[#d0d0db]"
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    background: ws.color,
                    boxShadow: `0 0 8px ${ws.color}40`,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[12.5px] font-medium truncate block leading-tight">
                    {ws.name}
                  </span>
                </div>
                <span className="text-[10px] text-[#6b6b80] tabular-nums shrink-0">
                  {ws.taskCount} tasks
                </span>
                {isActive && <Check className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-3 border-t border-white/[0.06]" />
      <div className="px-3 py-2 flex items-center gap-1">
        <Link
          href="/organizations"
          onClick={() => setIsOpen(false)}
          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-[#6b6b80] hover:text-[#d0d0db] hover:bg-white/[0.04] transition-all duration-150"
        >
          <ExternalLink className="w-3 h-3" />
          Manage orgs
        </Link>
        <div className="w-px h-3.5 bg-white/[0.06]" />
        <Link
          href={`/organization/${selectedOrgId}`}
          onClick={() => setIsOpen(false)}
          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-[#6b6b80] hover:text-[#d0d0db] hover:bg-white/[0.04] transition-all duration-150"
        >
          <Settings className="w-3 h-3" />
          Org settings
        </Link>
      </div>
    </div>
  );

  return (
    <div ref={dropdownRef} className="relative px-4 py-4 border-b border-[#333339]">
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
    </div>
  );
}
