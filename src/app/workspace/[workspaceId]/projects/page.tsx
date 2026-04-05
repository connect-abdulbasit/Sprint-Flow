"use client";

import { useParams } from "next/navigation";
import { WorkspaceProjects } from "../../../../pages/WorkspaceProjects";

export default function ProjectsRoute() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  if (!workspaceId) return null;

  return <WorkspaceProjects workspaceId={workspaceId} />;
}
