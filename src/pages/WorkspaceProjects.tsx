import React, { useState } from "react";
import { useProjects } from "../hooks/useProjects";
import { ProjectList } from "../components/ProjectList";
import { ProjectModal } from "../components/ProjectModal";
import { DeleteConfirmDialog } from "../components/DeleteConfirmDialog";
import { Project } from "../api/projects";

interface Props {
  // If routing handles dynamic params, pass it down as a prop.
  workspaceId: string;
}

export const WorkspaceProjects: React.FC<Props> = ({ workspaceId }) => {
  const { projects, loading, error, createProject, updateProject, deleteProject } =
    useProjects(workspaceId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const handleOpenCreate = () => {
    setProjectToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setProjectToEdit(project);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (project: Project) => {
    setProjectToDelete(project);
    setIsDeleteDialogOpen(true);
  };

  const handleModalSubmit = async (data: { name: string; description: string }) => {
    if (projectToEdit) {
      await updateProject(projectToEdit.id, data);
    } else {
      await createProject(data);
    }
    // Form submission handles its own catch, modal handles onClose
  };

  const handleDeleteConfirm = async () => {
    if (projectToDelete) {
      await deleteProject(projectToDelete.id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d12] min-h-screen">
      <div className="px-8 py-10 border-b border-white/[0.04] bg-[#111118]/40 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-[#f0f0f5] tracking-tight uppercase font-syne">
              Workspace Projects
            </h1>
            <p className="text-[12px] font-bold text-[#6b6b80] uppercase tracking-[0.2em] mt-2">
              Manage your initiatives
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[14px] font-black rounded-2xl transition-all shadow-lg shadow-indigo-500/20 uppercase tracking-wide"
          >
            Create Project
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-10 py-12 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium">
              ⚠️ {error}
            </div>
          )}

          {loading && projects.length === 0 ? (
            <div className="flex justify-center items-center py-32 text-indigo-400/50">
              <div className="animate-spin w-8 h-8 rounded-full border-4 border-current border-t-transparent" />
            </div>
          ) : (
            <ProjectList projects={projects} onEdit={handleOpenEdit} onDelete={handleOpenDelete} />
          )}
        </div>
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        projectToEdit={projectToEdit}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        projectName={projectToDelete?.name || ""}
      />
    </div>
  );
};
