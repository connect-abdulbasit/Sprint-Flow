import { NextRequest, NextResponse } from "next/server";
import { activityService } from "./activity.service";
import { getCurrentUser } from "@/lib/auth";
import { parsePaginationParams } from "@/lib/pagination";

export class ActivityController {
  async getActivities(req: NextRequest, workspaceId: string) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const pagination = parsePaginationParams(req.nextUrl.searchParams, {
        defaultPageSize: 20,
        maxPageSize: 100,
      });
      const activities = await activityService.getWorkspaceActivities(workspaceId, pagination);
      return NextResponse.json(activities);
    } catch (error) {
      console.error("Get activities error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to fetch activities" },
        { status: 500 }
      );
    }
  }
}

export const activityController = new ActivityController();
