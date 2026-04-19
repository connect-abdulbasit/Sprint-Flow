"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  readSelectedOrgId,
  readWorkspaceIdForOrg,
  writeSelectedOrgId,
  writeWorkspaceIdForOrg,
} from "@/lib/workspace-prefs";

type WorkspaceNavContextValue = {
  /** Workspace id from URL when on `/workspace/...`, otherwise last persisted workspace for the selected org */
  workspaceIdForNav: string;
  setNavWorkspaceId: (workspaceId: string) => void;
  /**
   * Persists org, picks stored workspace for that org or the first in the list, persists it, and updates nav fallback.
   * @returns chosen workspace id (may be empty if there are no workspaces)
   */
  syncWorkspaceSelection: (orgId: string, workspaces: readonly { id: string }[]) => string;
};

const WorkspaceNavContext = createContext<WorkspaceNavContextValue | null>(null);

export function WorkspaceNavProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const pathWorkspaceId = pathname.match(/^\/workspace\/([^/]+)/)?.[1] ?? "";
  const [fallbackWorkspaceId, setFallbackWorkspaceId] = useState("");

  useLayoutEffect(() => {
    const orgId = readSelectedOrgId();
    if (!orgId) return;
    const wsId = readWorkspaceIdForOrg(orgId);
    if (wsId) setFallbackWorkspaceId(wsId);
  }, []);

  const setNavWorkspaceId = useCallback((workspaceId: string) => {
    setFallbackWorkspaceId(workspaceId);
  }, []);

  const syncWorkspaceSelection = useCallback(
    (orgId: string, workspaces: readonly { id: string }[]) => {
      writeSelectedOrgId(orgId);
      let workspaceId = readWorkspaceIdForOrg(orgId);
      if (!workspaceId || !workspaces.some((w) => w.id === workspaceId)) {
        workspaceId = workspaces[0]?.id ?? "";
      }
      if (workspaceId) {
        writeWorkspaceIdForOrg(orgId, workspaceId);
        setFallbackWorkspaceId(workspaceId);
      } else {
        setFallbackWorkspaceId("");
      }
      return workspaceId;
    },
    []
  );

  const workspaceIdForNav = pathWorkspaceId || fallbackWorkspaceId;

  const value = useMemo(
    () => ({
      workspaceIdForNav,
      setNavWorkspaceId,
      syncWorkspaceSelection,
    }),
    [workspaceIdForNav, setNavWorkspaceId, syncWorkspaceSelection]
  );

  return <WorkspaceNavContext.Provider value={value}>{children}</WorkspaceNavContext.Provider>;
}

export function useWorkspaceNav(): WorkspaceNavContextValue {
  const ctx = useContext(WorkspaceNavContext);
  if (!ctx) {
    throw new Error("useWorkspaceNav must be used within WorkspaceNavProvider");
  }
  return ctx;
}
