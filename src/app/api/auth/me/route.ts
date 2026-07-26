export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { authController } from "@/modules/auth/auth.controller";

export async function GET(req: NextRequest) {
  return authController.getMe(req);
}

export async function PATCH(req: NextRequest) {
  return authController.updateProfile(req);
}
