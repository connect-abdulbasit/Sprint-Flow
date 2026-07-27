import { NextRequest } from "next/server";
import { attachmentController } from "@/modules/attachment/attachment.controller";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; attachmentId: string }> }
) {
  return attachmentController.delete(req, context);
}
