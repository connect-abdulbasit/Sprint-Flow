import { NextRequest } from "next/server";
import { sprintController } from "@/modules/sprint/sprint.controller";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return sprintController.list(req, context);
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return sprintController.create(req, context);
}
