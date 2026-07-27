import { NextRequest } from "next/server";
import { commentController } from "@/modules/comment/comment.controller";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; epicId: string }> }
) {
  return commentController.getEpicComments(req, context);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; epicId: string }> }
) {
  return commentController.addEpicComment(req, context);
}
