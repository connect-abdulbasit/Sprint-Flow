"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { readSelectedOrgId, readWorkspaceIdForOrg } from "@/lib/workspace-prefs";

export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const orgId = readSelectedOrgId();
    const workspaceId = orgId ? readWorkspaceIdForOrg(orgId) : null;
    if (workspaceId) {
      router.replace(`/workspace/${workspaceId}/profile`);
      return;
    }
    router.replace("/organizations");
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-[13px] text-muted">
      Opening profile…
    </div>
  );
}
