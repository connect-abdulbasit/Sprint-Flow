export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { authController } from "@/modules/auth/auth.controller";

export async function POST(req: NextRequest) {
  return authController.refresh(req);
}
