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
  workspaceIdForNav: string;
  setNavWorkspaceId: (_workspaceId: string) => void;
  syncWorkspaceSelection: (_orgId: string, _workspaces: readonly { id: string }[]) => string;
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
