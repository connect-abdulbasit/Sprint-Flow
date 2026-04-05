import { NextRequest } from "next/server";
import { projectController } from "@/modules/project/project.controller";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return projectController.update(req, { params });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return projectController.delete(req, { params });
}
