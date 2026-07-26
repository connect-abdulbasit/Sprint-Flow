import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InviteTeamPage from "./page";

const pushMock = vi.fn();
const replaceMock = vi.fn();
let searchParamsValue = new URLSearchParams({
  workspaceId: "workspace-1",
  workspaceName: "Acme Eng",
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
  useSearchParams: () => searchParamsValue,
}));

describe("Onboarding invite step (AUD-014 regression)", () => {
  beforeEach(() => {
    pushMock.mockReset();
    replaceMock.mockReset();
    searchParamsValue = new URLSearchParams({
      workspaceId: "workspace-1",
      workspaceName: "Acme Eng",
    });
  });

  it("actually POSTs to the invite API for each entered email instead of just navigating away", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<InviteTeamPage />);

    const emailInput = screen.getByPlaceholderText("colleague@company.com");
    await user.type(emailInput, "teammate@example.com");

    await user.click(screen.getByRole("button", { name: /send 1 invite/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/workspaces/workspace-1/invites",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "teammate@example.com", role: "member" }),
        })
      );
    });
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/workspace/workspace-1/dashboard");
    });

    vi.unstubAllGlobals();
  });

  it("shows an error and does not navigate away when every invite fails to send", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ error: "boom" }), { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<InviteTeamPage />);
    await user.type(screen.getByPlaceholderText("colleague@company.com"), "fail@example.com");
    await user.click(screen.getByRole("button", { name: /send 1 invite/i }));

    await screen.findByText(/could not send any invitations/i);
    expect(pushMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("navigates straight to the dashboard when skipped with no emails entered", async () => {
    const user = userEvent.setup();
    render(<InviteTeamPage />);

    await user.click(screen.getByRole("button", { name: /skip/i }));
    expect(pushMock).toHaveBeenCalledWith("/workspace/workspace-1/dashboard");
  });

  it("redirects back to workspace creation if there is no workspaceId in the URL", () => {
    searchParamsValue = new URLSearchParams();
    render(<InviteTeamPage />);
    expect(replaceMock).toHaveBeenCalledWith("/onboarding/workspace");
  });
});
