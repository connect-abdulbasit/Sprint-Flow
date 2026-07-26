import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectSettingsPage from "./page";

const mockProject = {
  id: "project-1",
  workspaceId: "workspace-1",
  name: "Original Name",
  description: "Original description",
  status: "active",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const fetchProjectMock = vi.fn();
const updateProjectMock = vi.fn();
const deleteProjectMock = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ projectId: "project-1", workspaceId: "workspace-1" }),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/workspace/workspace-1/projects/project-1/settings",
}));

vi.mock("@/lib/projects-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/projects-api")>("@/lib/projects-api");
  return {
    ...actual,
    fetchProject: (...args: unknown[]) => fetchProjectMock(...args),
    updateProject: (...args: unknown[]) => updateProjectMock(...args),
    deleteProject: (...args: unknown[]) => deleteProjectMock(...args),
  };
});

vi.mock("@/hooks/useWorkspaceRole", () => ({
  useWorkspaceRole: () => ({
    role: "admin",
    isLoading: false,
    hasRole: () => true,
    hasPermission: () => true,
    refetch: vi.fn(),
  }),
}));

describe("ProjectSettingsPage general save (AUD-010 regression)", () => {
  beforeEach(() => {
    fetchProjectMock.mockReset().mockResolvedValue(mockProject);
    updateProjectMock.mockReset();
    deleteProjectMock.mockReset();
  });

  it("saves edited name and description via the API when Save Changes is clicked", async () => {
    const user = userEvent.setup();
    updateProjectMock.mockResolvedValue({
      ...mockProject,
      name: "Renamed Project",
      description: "New description",
    });

    render(<ProjectSettingsPage />);

    const nameInput = await screen.findByLabelText("Project Name");
    expect(nameInput).toHaveValue("Original Name");

    await user.clear(nameInput);
    await user.type(nameInput, "Renamed Project");

    const descriptionInput = screen.getByLabelText("Description");
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "New description");

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    expect(saveButton).toBeEnabled();
    await user.click(saveButton);

    await waitFor(() => {
      expect(updateProjectMock).toHaveBeenCalledWith("project-1", {
        name: "Renamed Project",
        description: "New description",
      });
    });
    await screen.findByText("Changes saved.");
  });

  it("disables Save Changes until the form is actually edited", async () => {
    render(<ProjectSettingsPage />);
    await screen.findByLabelText("Project Name");

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    expect(saveButton).toBeDisabled();
  });

  it("shows an inline error and keeps edits when the save request fails", async () => {
    const user = userEvent.setup();
    updateProjectMock.mockRejectedValue(new Error("Name already in use"));

    render(<ProjectSettingsPage />);
    const nameInput = await screen.findByLabelText("Project Name");
    await user.clear(nameInput);
    await user.type(nameInput, "Duplicate Name");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await screen.findByText("Name already in use");
    expect(nameInput).toHaveValue("Duplicate Name");
  });
});
