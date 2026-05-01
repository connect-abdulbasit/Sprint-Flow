import { organizationController } from "@/modules/organization/organization.controller";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return organizationController.getDashboard(req, { params });
}
