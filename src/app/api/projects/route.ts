import { NextRequest } from "next/server";
import { projectController } from "@/modules/project/project.controller";

export async function GET(req: NextRequest) {
  return projectController.list(req);
}

export async function POST(req: NextRequest) {
  return projectController.create(req);
}
