import { NextRequest } from "next/server";
import { ticketController } from "@/modules/task/ticket.controller";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; ticketId: string }> }
) {
  return ticketController.activity(req, context);
}
