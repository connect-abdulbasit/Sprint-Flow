import { NextRequest } from "next/server";
import { epicController } from "@/modules/epic/epic.controller";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; epicId: string }> }
) {
  return epicController.activity(req, context);
}
