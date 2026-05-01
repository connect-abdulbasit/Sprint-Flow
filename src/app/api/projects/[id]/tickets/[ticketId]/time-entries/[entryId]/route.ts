import { NextRequest } from "next/server";
import { timeEntryController } from "@/modules/time_entry/time_entry.controller";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; ticketId: string; entryId: string }> }
) {
  return timeEntryController.delete(req, context);
}
