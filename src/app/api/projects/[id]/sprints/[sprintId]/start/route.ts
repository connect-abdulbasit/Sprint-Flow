import { NextRequest } from "next/server";
import { sprintController } from "@/modules/sprint/sprint.controller";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; sprintId: string }> }
) {
  return sprintController.start(req, context);
}
