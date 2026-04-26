import { NextRequest } from "next/server";
import { sprintController } from "@/modules/sprint/sprint.controller";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; sprintId: string }> }
) {
  return sprintController.update(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; sprintId: string }> }
) {
  return sprintController.delete(req, context);
}
