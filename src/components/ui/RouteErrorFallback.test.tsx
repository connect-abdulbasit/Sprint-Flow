import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RouteErrorFallback from "./RouteErrorFallback";

describe("RouteErrorFallback (AUD-016 regression)", () => {
  it("renders a recoverable error message with retry and a way back", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    const error = Object.assign(new Error("Boom"), { digest: "abc123" });

    render(<RouteErrorFallback error={error} reset={reset} />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    const retryButton = screen.getByRole("button", { name: /try again/i });
    await user.click(retryButton);
    expect(reset).toHaveBeenCalledTimes(1);

    expect(screen.getByRole("link", { name: /go back/i })).toHaveAttribute(
      "href",
      "/organizations"
    );
  });

  it("respects a custom homeHref", () => {
    render(
      <RouteErrorFallback
        error={new Error("Boom")}
        reset={vi.fn()}
        homeHref="/workspace/123/dashboard"
      />
    );
    expect(screen.getByRole("link", { name: /go back/i })).toHaveAttribute(
      "href",
      "/workspace/123/dashboard"
    );
  });
});
