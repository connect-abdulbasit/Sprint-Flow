import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import { useFocusTrap } from "./useFocusTrap";

function TestModal({ isOpen }: { isOpen: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, isOpen);
  if (!isOpen) return null;
  return (
    <div ref={ref} role="dialog">
      <button>First</button>
      <button>Middle</button>
      <button>Last</button>
    </div>
  );
}

describe("useFocusTrap (AUD-015 regression)", () => {
  it("moves initial focus inside the container when opened", () => {
    render(<TestModal isOpen={true} />);
    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
  });

  it("wraps Tab from the last focusable element back to the first", async () => {
    const user = userEvent.setup();
    render(<TestModal isOpen={true} />);

    screen.getByRole("button", { name: "Last" }).focus();
    await user.tab();

    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
  });

  it("wraps Shift+Tab from the first focusable element back to the last", async () => {
    const user = userEvent.setup();
    render(<TestModal isOpen={true} />);

    screen.getByRole("button", { name: "First" }).focus();
    await user.tab({ shift: true });

    expect(screen.getByRole("button", { name: "Last" })).toHaveFocus();
  });

  it("restores focus to the previously focused element on close", () => {
    function Wrapper({ open }: { open: boolean }) {
      return (
        <div>
          <button data-testid="trigger">Open modal</button>
          <TestModal isOpen={open} />
        </div>
      );
    }

    const { rerender } = render(<Wrapper open={false} />);
    const trigger = screen.getByTestId("trigger");
    trigger.focus();
    expect(trigger).toHaveFocus();

    rerender(<Wrapper open={true} />);
    expect(trigger).not.toHaveFocus();

    rerender(<Wrapper open={false} />);
    expect(trigger).toHaveFocus();
  });
});
