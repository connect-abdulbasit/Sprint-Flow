import { NextRequest, NextResponse } from "next/server";
import { workspaceController } from "@/modules/workspace/workspace.controller";

export const runtime = "nodejs";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    return workspaceController.getNotificationSettings(req, context);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    return workspaceController.updateNotificationSettings(req, context);
}
