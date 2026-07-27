import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressRing, ProgressBar } from "./ProgressRing";

describe("ProgressRing", () => {
  it("clamps and displays an out-of-range percent", () => {
    render(<ProgressRing percent={150} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("clamps a negative percent to 0", () => {
    render(<ProgressRing percent={-10} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("always renders the percentage as text, not just a color cue", () => {
    render(<ProgressRing percent={42} />);
    expect(screen.getByText("42%")).toBeInTheDocument();
  });
});

describe("ProgressBar", () => {
  it("renders the clamped percentage as both width and text", () => {
    const { container } = render(<ProgressBar percent={200} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
    const fill = container.querySelector('[style*="width"]');
    expect(fill).toHaveStyle({ width: "100%" });
  });
});
