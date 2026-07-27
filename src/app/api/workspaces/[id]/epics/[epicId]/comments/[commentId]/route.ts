import { NextRequest } from "next/server";
import { commentController } from "@/modules/comment/comment.controller";

export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
      epicId: string;
      commentId: string;
    }>;
  }
) {
  return commentController.deleteComment(req, context);
}
