import { NextRequest } from "next/server";
import { workspaceController } from "@/modules/workspace/workspace.controller";

export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  return workspaceController.removeMember(req, context);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  return workspaceController.updateMemberRole(req, context);
}
