import { NextRequest } from "next/server";
import { epicController } from "@/modules/epic/epic.controller";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return epicController.list(req, context);
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return epicController.create(req, context);
}
