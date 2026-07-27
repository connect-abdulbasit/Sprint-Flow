import { NextRequest } from "next/server";
import { attachmentController } from "@/modules/attachment/attachment.controller";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; ticketId: string }> }
) {
  return attachmentController.listForTask(req, context);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; ticketId: string }> }
) {
  return attachmentController.addForTask(req, context);
}
