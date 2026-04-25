/** Human-readable ticket prefix from project name (e.g. \"SprintFlow\" → \"SPRI\"). */
export function projectKeyPrefix(projectName: string) {
  const prefix = projectName
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 4);
  return prefix.length > 0 ? prefix : "TKT";
}

export function ticketKey(projectName: string, ticketNumber: number) {
  return `${projectKeyPrefix(projectName)}-${ticketNumber}`;
}
