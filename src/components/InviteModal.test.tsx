import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InviteModal from "./InviteModal";

describe("InviteModal (AUD-015 / AUD-056 regression)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }))
    );
  });

  it("closes on Escape, which it previously did not support", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <InviteModal isOpen={true} onClose={onClose} workspaceId="workspace-1" workspaceName="Acme" />
    );

    await screen.findByText("Invite People");
    await user.keyboard("{Escape}");

    await waitFor(() => expect(onClose).toHaveBeenCalled(), { timeout: 500 });
  });

  it("has an accessible dialog role and label", async () => {
    render(
      <InviteModal isOpen={true} onClose={vi.fn()} workspaceId="workspace-1" workspaceName="Acme" />
    );

    const dialog = await screen.findByRole("dialog", { name: /invite people/i });
    expect(dialog).toBeInTheDocument();
  });
});
