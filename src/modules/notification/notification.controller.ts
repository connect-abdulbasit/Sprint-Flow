import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { notificationService } from "./notification.service";

export class NotificationController {
  async list(req: NextRequest, context?: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      if (context?.params) {
        const { id: workspaceId } = await context.params;
        const notifications = await notificationService.getWorkspaceNotifications(
          user.id,
          workspaceId
        );
        return NextResponse.json(notifications);
      }

      const notifications = await notificationService.getUserNotifications(user.id);
      return NextResponse.json(notifications);
    } catch (error) {
      console.error("Fetch notifications error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to fetch notifications" },
        { status: 500 }
      );
    }
  }

  async markRead(req: NextRequest) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const body = await req.json();
      const notificationId = String(body.notificationId ?? "").trim();
      if (!notificationId) {
        return NextResponse.json({ error: "notificationId is required" }, { status: 400 });
      }

      await notificationService.markNotificationAsRead(notificationId, user.id);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Mark notification read error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to mark notification as read" },
        { status: 500 }
      );
    }
  }
}

export const notificationController = new NotificationController();
