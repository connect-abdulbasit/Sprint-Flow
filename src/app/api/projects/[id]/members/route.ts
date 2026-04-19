import { NextRequest } from "next/server";
import { projectController } from "@/modules/project/project.controller";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return projectController.listMembers(req, context);
}
