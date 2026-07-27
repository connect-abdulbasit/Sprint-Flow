import type { ProjectTicket, Epic } from "@/lib/projects-api";

/** Plain, dependency-free substring search — same approach `BoardToolbar`
 * already uses for its search box. No fuzzy ranking/full-text index; this app
 * doesn't need one at its current scale. */
function includesQuery(haystack: (string | null | undefined)[], query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystack.some((h) => h?.toLowerCase().includes(q));
}

export function searchTickets(tickets: ProjectTicket[], query: string): ProjectTicket[] {
  if (!query.trim()) return tickets;
  return tickets.filter((t) =>
    includesQuery(
      [
        t.key,
        t.title,
        t.description,
        t.assigneeName,
        t.reporterName,
        t.status,
        t.priority,
        ...(t.labels ?? []),
      ],
      query
    )
  );
}

export function searchEpics(epics: Epic[], query: string): Epic[] {
  if (!query.trim()) return epics;
  return epics.filter((e) =>
    includesQuery(
      [e.name, e.description, e.ownerName, e.status, e.priority, ...(e.labels ?? [])],
      query
    )
  );
}

/** Global search across both epics and issues/subtasks — used by the top-level
 * search bar (matches on epic/issue/subtask title, owner/assignee, labels,
 * status, priority, per the app's "Search" requirements). */
export function globalSearch(epics: Epic[], tickets: ProjectTicket[], query: string) {
  return {
    epics: searchEpics(epics, query),
    tickets: searchTickets(tickets, query),
  };
}
