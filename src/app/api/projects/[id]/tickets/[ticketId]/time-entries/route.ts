import { NextRequest } from "next/server";
import { timeEntryController } from "@/modules/time_entry/time_entry.controller";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; ticketId: string }> }
) {
  return timeEntryController.create(req, context);
}
