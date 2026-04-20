import { NextRequest } from "next/server";
import { ticketController } from "@/modules/task/ticket.controller";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return ticketController.list(req, context);
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return ticketController.create(req, context);
}
