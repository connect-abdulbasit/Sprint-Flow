import { NextRequest } from "next/server";
import { ticketController } from "@/modules/task/ticket.controller";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; ticketId: string }> }
) {
  return ticketController.get(req, context);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; ticketId: string }> }
) {
  return ticketController.update(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; ticketId: string }> }
) {
  return ticketController.delete(req, context);
}
