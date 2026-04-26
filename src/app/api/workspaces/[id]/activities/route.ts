import { NextRequest } from "next/server";
import { activityController } from "@/modules/activity/activity.controller";

export const runtime = "nodejs";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    return activityController.getActivities(req, id);
}

