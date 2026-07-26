import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "./page";

vi.mock("next/navigation", () => ({
  useParams: () => ({ workspaceId: "workspace-1" }),
}));

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 500) {
  return Promise.resolve(new Response(JSON.stringify(body), { status }));
}

describe("DashboardPage (AUD-017 regression)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a visible error banner when a section fails to load, instead of silently rendering as empty", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.endsWith("/dashboard")) return jsonResponse({}, false, 500);
      if (url.endsWith("/activities")) return jsonResponse([]);
      return jsonResponse({ name: "Acme", color: "#4f7cff" });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/dashboard metrics/i);
    });

    vi.unstubAllGlobals();
  });

  it("retries all three requests when Retry is clicked", async () => {
    let dashboardCallCount = 0;
    const fetchMock = vi.fn((url: string) => {
      if (url.endsWith("/dashboard")) {
        dashboardCallCount += 1;
        return jsonResponse({}, dashboardCallCount > 1, dashboardCallCount > 1 ? 200 : 500);
      }
      if (url.endsWith("/activities")) return jsonResponse([]);
      return jsonResponse({ name: "Acme", color: "#4f7cff" });
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<DashboardPage />);

    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
    expect(dashboardCallCount).toBe(2);

    vi.unstubAllGlobals();
  });

  it("shows no error banner when every request succeeds", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.endsWith("/dashboard")) return jsonResponse({});
      if (url.endsWith("/activities")) return jsonResponse([]);
      return jsonResponse({ name: "Acme", color: "#4f7cff" });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByText(/couldn't load/i)).not.toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });
});
