import { NextRequest } from "next/server";
import { notificationController } from "@/modules/notification/notification.controller";
import { workspaceController } from "@/modules/workspace/workspace.controller";

export const runtime = "nodejs";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return notificationController.list(req, context);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return workspaceController.updateNotificationSettings(req, context);
}
