import { organizationController } from "@/modules/organization/organization.controller";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return organizationController.get(req, { params });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return organizationController.update(req, { params });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return organizationController.delete(req, { params });
}
