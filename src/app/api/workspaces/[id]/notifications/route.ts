export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { notificationController } from "@/modules/notification/notification.controller";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return notificationController.list(req, context);
}
