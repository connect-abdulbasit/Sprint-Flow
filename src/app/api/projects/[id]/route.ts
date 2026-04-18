import { NextRequest } from "next/server";
import { projectController } from "@/modules/project/project.controller";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return projectController.update(req, context);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return projectController.delete(req, context);
}
