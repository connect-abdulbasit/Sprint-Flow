import { NextRequest } from "next/server";
import { workspaceController } from "@/modules/workspace/workspace.controller";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return workspaceController.checkSlug(req);
}
