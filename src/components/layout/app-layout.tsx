"use client";

import { WorkspaceNavProvider } from "@/contexts/workspace-nav-context";
import Sidebar from "./sidebar";
import Topbar from "./topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceNavProvider>
      <div className="flex h-screen bg-transparent text-[#f0f0f5] overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-transparent">
          <Topbar />
          <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-8 pt-2">
            <div className="max-w-[1600px] mx-auto h-full">{children}</div>
          </main>
        </div>
      </div>
    </WorkspaceNavProvider>
  );
}
