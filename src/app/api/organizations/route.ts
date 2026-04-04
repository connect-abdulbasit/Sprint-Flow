export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { organizationController } from "@/modules/organization/organization.controller";

export async function POST(req: NextRequest) {
  return organizationController.create(req);
}

export async function GET(req: NextRequest) {
  return organizationController.list(req);
}
