"use client";

import { WorkspaceNavProvider } from "@/contexts/workspace-nav-context";
import Sidebar from "./sidebar";
import Topbar from "./topbar";

export default function AppLayout({
  children,
  mainClassName = "flex-1 min-h-0 overflow-y-auto overscroll-contain p-8 pt-2",
  contentClassName = "max-w-[1600px] mx-auto h-full",
}: {
  children: React.ReactNode;
  mainClassName?: string;
  contentClassName?: string;
}) {
  return (
    <WorkspaceNavProvider>
      <div className="flex h-screen bg-transparent text-fg overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-transparent">
          <Topbar />
          <main className={mainClassName}>
            <div className={contentClassName}>{children}</div>
          </main>
        </div>
      </div>
    </WorkspaceNavProvider>
  );
}
