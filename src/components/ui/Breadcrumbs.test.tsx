import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Breadcrumbs from "./Breadcrumbs";

describe("Breadcrumbs", () => {
  it("renders every item's label in order", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Project", href: "/project" },
          { label: "Epic", href: "/project/epic" },
          { label: "Task" },
        ]}
      />
    );

    const labels = screen.getAllByText(/Project|Epic|Task/).map((el) => el.textContent);
    expect(labels).toEqual(["Project", "Epic", "Task"]);
  });

  it("links every item except the last one", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Project", href: "/project" },
          { label: "Epic", href: "/project/epic" },
          { label: "Task", href: "/project/epic/task" },
        ]}
      />
    );

    expect(screen.getByRole("link", { name: "Project" })).toHaveAttribute("href", "/project");
    expect(screen.getByRole("link", { name: "Epic" })).toHaveAttribute("href", "/project/epic");
    // The last item is the current page — never a link, even if an href was passed.
    expect(screen.queryByRole("link", { name: "Task" })).not.toBeInTheDocument();
    expect(screen.getByText("Task")).toBeInTheDocument();
  });

  it("renders a single item with no link and no separator", () => {
    render(<Breadcrumbs items={[{ label: "Only item" }]} />);
    expect(screen.getByText("Only item")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
