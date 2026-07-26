import { NextRequest, NextResponse } from "next/server";
import { activityService } from "./activity.service";
import { getCurrentUserWithRole } from "@/lib/auth";
import { parsePaginationParams } from "@/lib/pagination";

export class ActivityController {
  async getActivities(req: NextRequest, workspaceId: string) {
    // AUD-006: this previously only checked the caller was logged in, not that they
    // belong to `workspaceId` — any authenticated user could read any workspace's full
    // activity log by knowing/guessing its id.
    const member = await getCurrentUserWithRole(req, workspaceId);
    if (!member) {
      return NextResponse.json(
        { error: "Unauthorized or not a member of this workspace" },
        { status: 401 }
      );
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
