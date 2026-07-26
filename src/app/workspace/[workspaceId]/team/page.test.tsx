import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TeamPage from "./page";

const members = [
  {
    userId: "admin-1",
    role: "admin",
    joinedAt: new Date().toISOString(),
    name: "Ada Admin",
    email: "ada@example.com",
    avatarUrl: null,
  },
  {
    userId: "member-1",
    role: "member",
    joinedAt: new Date().toISOString(),
    name: "Mo Member",
    email: "mo@example.com",
    avatarUrl: null,
  },
];

vi.mock("next/navigation", () => ({
  useParams: () => ({ workspaceId: "workspace-1" }),
}));

vi.mock("@/hooks/useWorkspaceRole", () => ({
  useWorkspaceRole: () => ({
    role: "admin",
    isLoading: false,
    hasRole: (r: string) => r === "admin" || r === "project_manager" || r === "member",
    hasPermission: () => true,
    refetch: vi.fn(),
  }),
}));

function mockFetchSequence() {
  return vi.fn((url: string, init?: RequestInit) => {
    if (url === "/api/workspaces/workspace-1/members" && (!init || init.method === undefined)) {
      return Promise.resolve(new Response(JSON.stringify(members), { status: 200 }));
    }
    if (url === "/api/workspaces/workspace-1") {
      return Promise.resolve(
        new Response(JSON.stringify({ name: "Test Workspace" }), { status: 200 })
      );
    }
    if (url === "/api/auth/me") {
      return Promise.resolve(
        new Response(JSON.stringify({ user: { id: "admin-1", name: "Ada Admin" } }), {
          status: 200,
        })
      );
    }
    if (url.startsWith("/api/workspaces/workspace-1/members/") && init?.method === "DELETE") {
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    }
    if (url.startsWith("/api/workspaces/workspace-1/members/") && init?.method === "PATCH") {
      return Promise.resolve(
        new Response(JSON.stringify({ success: true, role: "project_manager" }), { status: 200 })
      );
    }
    return Promise.reject(new Error(`Unhandled fetch: ${url}`));
  });
}

describe("TeamPage member management menu (AUD-012 / AUD-013 regression)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetchSequence());
  });

  it("shows an actions menu for an admin managing another member, with role change and remove options", async () => {
    const user = userEvent.setup();
    render(<TeamPage />);

    await screen.findByText("Mo Member");

    const memberRow = screen.getByText("Mo Member").closest("div.group") as HTMLElement;
    const menuButton = within(memberRow).getByRole("button", { name: /actions for mo member/i });
    await user.click(menuButton);

    expect(screen.getByRole("menuitem", { name: /make admin/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /remove from workspace/i })).toBeInTheDocument();
  });

  it("calls the DELETE endpoint when a remove is confirmed", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetchSequence();
    vi.stubGlobal("fetch", fetchMock);

    render(<TeamPage />);
    await screen.findByText("Mo Member");

    const memberRow = screen.getByText("Mo Member").closest("div.group") as HTMLElement;
    await user.click(within(memberRow).getByRole("button", { name: /actions for mo member/i }));
    await user.click(screen.getByRole("menuitem", { name: /remove from workspace/i }));

    await user.click(screen.getByRole("button", { name: /remove member/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/workspaces/workspace-1/members/member-1",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  it("offers 'Leave workspace' for the current user's own row instead of role/remove options", async () => {
    const user = userEvent.setup();
    render(<TeamPage />);

    await screen.findByText("Ada Admin");
    const selfRow = screen.getByText("Ada Admin").closest("div.group") as HTMLElement;
    await user.click(within(selfRow).getByRole("button", { name: /actions for ada admin/i }));

    expect(screen.getByRole("menuitem", { name: /leave workspace/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /remove from workspace/i })
    ).not.toBeInTheDocument();
  });
});
