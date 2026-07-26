import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceNavProvider } from "@/contexts/workspace-nav-context";
import Sidebar from "./sidebar";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/organizations",
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

function mockFetch() {
  return vi.fn((url: string, init?: RequestInit) => {
    if (url === "/api/auth/logout" && init?.method === "POST") {
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    }
    if (url === "/api/auth/me") {
      return Promise.resolve(
        new Response(JSON.stringify({ user: { name: "Ada Lovelace", email: "ada@example.com" } }), {
          status: 200,
        })
      );
    }
    if (url === "/api/organizations") {
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
    }
    return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
  });
}

describe("Sidebar sign-out (AUD-059 regression)", () => {
  beforeEach(() => {
    pushMock.mockReset();
    localStorage.clear();
    vi.stubGlobal("fetch", mockFetch());
  });

  it("signs the user out and redirects to /signin when the profile row is clicked", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <WorkspaceNavProvider>
        <Sidebar />
      </WorkspaceNavProvider>
    );

    const signOutButton = await screen.findByRole("button", { name: /sign out/i });
    await user.click(signOutButton);

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
    expect(pushMock).toHaveBeenCalledWith("/signin");
  });
});
