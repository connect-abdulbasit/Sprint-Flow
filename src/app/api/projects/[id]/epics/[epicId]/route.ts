import { NextRequest } from "next/server";
import { epicController } from "@/modules/epic/epic.controller";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; epicId: string }> }
) {
  return epicController.get(req, context);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; epicId: string }> }
) {
  return epicController.update(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; epicId: string }> }
) {
  return epicController.delete(req, context);
}
