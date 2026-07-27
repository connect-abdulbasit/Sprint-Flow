import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkspaceNavProvider } from "@/contexts/workspace-nav-context";
import Sidebar from "./sidebar";

const pushMock = vi.fn();
const WORKSPACE_ID = "ws-test-123";

vi.mock("next/navigation", () => ({
  usePathname: () => `/workspace/${WORKSPACE_ID}/dashboard`,
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

function mockFetch() {
  return vi.fn((url: string) => {
    if (url === "/api/auth/me") {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            user: {
              name: "Ada Lovelace",
              email: "ada@example.com",
              avatarUrl: null,
            },
          }),
          { status: 200 }
        )
      );
    }
    if (url === "/api/organizations") {
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
    }
    if (url.startsWith(`/api/workspaces/${WORKSPACE_ID}/notifications`)) {
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
    }
    return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
  });
}

describe("Sidebar account row", () => {
  beforeEach(() => {
    pushMock.mockReset();
    localStorage.clear();
    vi.stubGlobal("fetch", mockFetch());
  });

  it("links the profile row to the current workspace profile", async () => {
    render(
      <WorkspaceNavProvider>
        <Sidebar />
      </WorkspaceNavProvider>
    );

    const profileLink = await screen.findByRole("link", { name: /open profile/i });
    expect(profileLink).toHaveAttribute("href", `/workspace/${WORKSPACE_ID}/profile`);
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
  });
});
