export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { authController } from "@/modules/auth/auth.controller";

export async function POST(req: NextRequest) {
  return authController.uploadAvatar(req);
}

export async function DELETE(req: NextRequest) {
  return authController.deleteAvatar(req);
}
