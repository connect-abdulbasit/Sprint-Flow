export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { organizationController } from "@/modules/organization/organization.controller";

export async function POST(req: NextRequest) {
  return organizationController.acceptInvite(req);
}
