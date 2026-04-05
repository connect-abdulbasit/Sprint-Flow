import React from "react";
import { Project } from "../api/projects";

interface Props {
  projects: Project[];
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
}

export const ProjectList: React.FC<Props> = ({ projects, onEdit, onDelete }) => {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
        <h3 className="text-xl font-bold text-white mb-2">No projects yet</h3>
        <p className="text-gray-400">Create a project to get started with your workspace.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <div
          key={project.id}
          className="flex flex-col border border-white/10 bg-[#16161e]/40 p-6 rounded-2xl shadow-xl hover:border-white/20 transition-all"
        >
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{project.name}</h3>
            <p className="text-sm text-gray-400 line-clamp-2">
              {project.description || "No description provided."}
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
            <button
              onClick={() => onEdit(project)}
              className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(project)}
              className="text-sm font-bold text-red-500 hover:text-red-400 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
