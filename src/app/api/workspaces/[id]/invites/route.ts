import { NextRequest } from "next/server";
import { workspaceController } from "@/modules/workspace/workspace.controller";

export const runtime = "nodejs";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return workspaceController.sendInvite(req, context);
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return workspaceController.listInvites(req, context);
}
