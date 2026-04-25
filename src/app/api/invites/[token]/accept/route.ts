import { NextRequest } from "next/server";
import { workspaceController } from "@/modules/workspace/workspace.controller";

export const runtime = "nodejs";

export async function POST(req: NextRequest, context: { params: Promise<{ token: string }> }) {
  return workspaceController.acceptInvite(req, context);
}
