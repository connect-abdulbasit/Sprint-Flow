import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useProjects } from "./useProjects";
import type { Project } from "@/lib/projects-api";

vi.mock("@/lib/projects-api", () => ({
  fetchProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}));

import { fetchProjects } from "@/lib/projects-api";

function deferred<T>() {
  let resolveFn: (_value: T) => void = () => {};
  const promise = new Promise<T>((r) => {
    resolveFn = r;
  });
  return { promise, resolve: resolveFn };
}

describe("useProjects (AUD-048 regression)", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("ignores a stale response for a previous workspaceId that resolves after a newer one", async () => {
    const first = deferred<Project[]>();
    const second = deferred<Project[]>();

    const mockFetch = fetchProjects as unknown as ReturnType<typeof vi.fn>;
    mockFetch.mockImplementationOnce(() => first.promise);
    mockFetch.mockImplementationOnce(() => second.promise);

    const { result, rerender } = renderHook(({ workspaceId }) => useProjects(workspaceId), {
      initialProps: { workspaceId: "workspace-A" },
    });

    // Switch workspaces before the first request resolves.
    rerender({ workspaceId: "workspace-B" });

    // The *newer* request (for workspace-B) resolves first.
    second.resolve([{ id: "b-1", name: "Workspace B Project" } as Project]);
    await waitFor(() => {
      expect(result.current.projects).toHaveLength(1);
    });

    // The *stale* request (for workspace-A) resolves after — it must be ignored.
    first.resolve([{ id: "a-1", name: "Workspace A Project" } as Project]);

    await new Promise((r) => setTimeout(r, 20));
    expect(result.current.projects).toEqual([{ id: "b-1", name: "Workspace B Project" }]);
  });
});
