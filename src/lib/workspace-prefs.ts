const LS_SELECTED_ORG = "sprintflow:selectedOrgId";
const LS_WORKSPACE_BY_ORG = "sprintflow:workspaceIdByOrg";

function parseWorkspaceMap(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function readSelectedOrgId(): string | null {
  if (typeof window === "undefined") return null;
  const id = localStorage.getItem(LS_SELECTED_ORG);
  return id && id.length > 0 ? id : null;
}

export function writeSelectedOrgId(orgId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_SELECTED_ORG, orgId);
}

export function readWorkspaceIdForOrg(orgId: string): string | null {
  if (typeof window === "undefined") return null;
  const map = parseWorkspaceMap(localStorage.getItem(LS_WORKSPACE_BY_ORG));
  const id = map[orgId];
  return id && id.length > 0 ? id : null;
}

export function writeWorkspaceIdForOrg(orgId: string, workspaceId: string): void {
  if (typeof window === "undefined") return;
  const map = parseWorkspaceMap(localStorage.getItem(LS_WORKSPACE_BY_ORG));
  map[orgId] = workspaceId;
  localStorage.setItem(LS_WORKSPACE_BY_ORG, JSON.stringify(map));
}
