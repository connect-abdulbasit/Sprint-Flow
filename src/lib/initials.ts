export function initialsFromName(name: string | null | undefined) {
  const t = name?.trim();
  if (!t) return "—";
  const parts = t.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
