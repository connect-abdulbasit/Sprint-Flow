export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { notificationController } from "@/modules/notification/notification.controller";

export async function GET(req: NextRequest) {
  return notificationController.list(req);
}

export async function PATCH(req: NextRequest) {
  return notificationController.markRead(req);
}
