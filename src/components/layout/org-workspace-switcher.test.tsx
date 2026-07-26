import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceNavProvider } from "@/contexts/workspace-nav-context";
import OrgWorkspaceSwitcher from "./org-workspace-switcher";

vi.mock("next/navigation", () => ({
  usePathname: () => "/organizations",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const orgs = [{ id: "org-1", name: "Acme Inc", role: "owner" }];
const workspaces = [
  {
    id: "ws-1",
    name: "Engineering",
    color: "#4f7cff",
    organizationId: "org-1",
    role: "admin",
    memberCount: 3,
  },
];

function mockFetch() {
  return vi.fn((url: string) => {
    if (url === "/api/organizations") {
      return Promise.resolve(new Response(JSON.stringify(orgs), { status: 200 }));
    }
    if (url === "/api/workspaces") {
      return Promise.resolve(new Response(JSON.stringify(workspaces), { status: 200 }));
    }
    return Promise.reject(new Error(`Unhandled fetch: ${url}`));
  });
}

describe("OrgWorkspaceSwitcher (AUD-018 / AUD-053 regression)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", mockFetch());
  });

  it("opens the create-workspace modal when the '+ New workspace' button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <WorkspaceNavProvider>
        <OrgWorkspaceSwitcher isCollapsed={false} />
      </WorkspaceNavProvider>
    );

    // Open the switcher dropdown first.
    const trigger = await screen.findByText("Acme Inc");
    await user.click(trigger);

    const newWorkspaceButton = await screen.findByTitle("New workspace");
    await user.click(newWorkspaceButton);

    expect(await screen.findByText("New Workspace")).toBeInTheDocument();
  });

  it("shows a real member count instead of a hardcoded task count", async () => {
    const user = userEvent.setup();
    render(
      <WorkspaceNavProvider>
        <OrgWorkspaceSwitcher isCollapsed={false} />
      </WorkspaceNavProvider>
    );

    const trigger = await screen.findByText("Acme Inc");
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("3 members")).toBeInTheDocument();
    });
  });
});
