import AppLayout from "@/components/layout/app-layout";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";

  if (!workspaceId || !host) {
    redirect("/organizations");
  }

  const cookieStore = await cookies();
  const workspaceRes = await fetch(`${protocol}://${host}/api/workspaces/${workspaceId}`, {
    headers: {
      cookie: cookieStore.toString(),
    },
    cache: "no-store",
  });

  if (!workspaceRes.ok) {
    redirect("/organizations");
  }

  return <AppLayout>{children}</AppLayout>;
}
