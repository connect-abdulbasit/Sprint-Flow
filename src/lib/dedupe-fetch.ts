/** Coalesce concurrent identical fetches so duplicate hooks/components share one request. */
const inflight = new Map<string, Promise<unknown>>();

export function dedupeFetch<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fn().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}

export function clearDedupeFetch(keyPrefix: string) {
  for (const key of inflight.keys()) {
    if (key.startsWith(keyPrefix)) inflight.delete(key);
  }
}
