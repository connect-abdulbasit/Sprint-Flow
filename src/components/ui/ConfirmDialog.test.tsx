import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmDialog from "./ConfirmDialog";

describe("ConfirmDialog (AUD-007 regression)", () => {
  it("stays open and shows an error when onConfirm rejects, instead of closing silently", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn().mockRejectedValue(new Error("Delete failed: network error"));

    render(
      <ConfirmDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete ticket"
        confirmLabel="Delete"
      />
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Delete failed: network error");
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes only after onConfirm resolves successfully", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <ConfirmDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete ticket"
        confirmLabel="Delete"
      />
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("clears any previous error when reopened", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockRejectedValue(new Error("boom"));
    const { rerender } = render(
      <ConfirmDialog isOpen={true} onClose={vi.fn()} onConfirm={onConfirm} title="Delete" />
    );

    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());

    rerender(
      <ConfirmDialog isOpen={false} onClose={vi.fn()} onConfirm={onConfirm} title="Delete" />
    );
    rerender(
      <ConfirmDialog isOpen={true} onClose={vi.fn()} onConfirm={onConfirm} title="Delete" />
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
