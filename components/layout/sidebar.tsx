"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    BarChart2,
    Users,
    Settings,
    Briefcase,
    Columns,
    ListTodo,
    Rocket,
    FileText,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function Sidebar() {
    const pathname = usePathname() || "";
    const [isCollapsed, setIsCollapsed] = useState(false);

    const workspaceMatch = pathname.match(/^\/workspace\/([^/]+)/);
    const workspaceId = workspaceMatch ? workspaceMatch[1] : "default";

    const projectMatch = pathname.match(/^\/workspace\/[^/]+\/projects\/([^/]+)/);
    const projectId = projectMatch ? projectMatch[1] : null;

    // Fetch workspace name and current user dynamically
    const [workspace, setWorkspace] = useState<{ name: string; id: string } | null>(null);
    const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);

    useEffect(() => {
        fetch("/api/workspace")
            .then((r) => r.json())
            .then((data) => {
                if (data.workspaces?.length > 0) {
                    setWorkspace(data.workspaces[0]);
                }
            })
            .catch(() => {});

        fetch("/api/auth/me")
            .then((r) => r.json())
            .then((data) => {
                if (data.user) setCurrentUser(data.user);
            })
            .catch(() => {});
    }, []);

    const mainMenuItems = [
        { name: "Dashboard", href: `/workspace/${workspaceId}/dashboard`, icon: LayoutDashboard },
        { name: "Projects", href: `/workspace/${workspaceId}/projects`, icon: FolderKanban },
        { name: "My Tasks", href: `/workspace/${workspaceId}/my-tasks`, icon: CheckSquare },
        { name: "Reports", href: `/workspace/${workspaceId}/reports`, icon: BarChart2 },
        { name: "Team", href: `/workspace/${workspaceId}/team`, icon: Users },
        { name: "Settings", href: `/workspace/${workspaceId}/settings`, icon: Settings },
    ];

    const projectMenuItems = projectId
        ? [
            { name: "Overview", href: `/workspace/${workspaceId}/projects/${projectId}/overview`, icon: Briefcase },
            { name: "Board", href: `/workspace/${workspaceId}/projects/${projectId}/board`, icon: Columns },
            { name: "Backlog", href: `/workspace/${workspaceId}/projects/${projectId}/backlog`, icon: ListTodo },
            { name: "Sprints", href: `/workspace/${workspaceId}/projects/${projectId}/sprints`, icon: Rocket },
            { name: "Members", href: `/workspace/${workspaceId}/projects/${projectId}/members`, icon: Users },
            { name: "Reports", href: `/workspace/${workspaceId}/projects/${projectId}/reports`, icon: FileText },
            { name: "Settings", href: `/workspace/${workspaceId}/projects/${projectId}/settings`, icon: Settings },
        ]
        : [];

    const NavItem = ({ item }: { item: any }) => {
        const isActive = pathname.startsWith(item.href) &&
            (item.href !== `/workspace/${workspaceId}/projects` || pathname === item.href) &&
            (item.name !== 'Dashboard' || pathname === item.href);

        let finalIsActive = pathname === item.href;
        if (item.name === "Projects" && !projectId) {
            finalIsActive = pathname.startsWith(item.href);
        } else if (projectId && item.href.includes(projectId)) {
            finalIsActive = pathname.includes(item.href);
        }

        return (
            <Link
                href={item.href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-sm font-medium relative overflow-hidden ${finalIsActive
                    ? "text-white bg-gradient-to-r from-[#4f7cff]/10 to-transparent border border-[#4f7cff]/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                    : "text-[#9090a8] hover:text-white hover:bg-white/[0.03] border border-transparent"
                    } ${isCollapsed ? "justify-center px-0" : ""}`}
                title={isCollapsed ? item.name : undefined}
            >
                {finalIsActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#4f7cff] rounded-r-full shadow-[0_0_12px_#4f7cff]" />
                )}
                <item.icon className={`w-[18px] h-[18px] shrink-0 transition-all duration-300 ${finalIsActive ? "text-[#4f7cff]" : "text-[#6b6b80] group-hover:text-[#a259ff]"}`} />
                {!isCollapsed && <span className="tracking-wide relative z-10">{item.name}</span>}
            </Link>
        );
    };

    return (
        <aside
            className={`relative flex flex-col h-full bg-[#111118]/60 backdrop-blur-2xl text-[#f0f0f5] border-r border-[#333339] shadow-[4px_0_24px_-12px_rgba(0,0,0,0.5)] transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] z-40 ${isCollapsed ? "w-20" : "w-[272px]"
                }`}
        >
            <div className="p-5 flex items-center justify-between border-b border-[#333339]">
                <div
                    className={`group flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-xl w-full transition-all duration-300 border border-transparent hover:border-white/10 ${isCollapsed ? "justify-center" : ""
                        }`}
                >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4f7cff] to-[#a259ff] flex items-center justify-center font-bold shrink-0 text-white shadow-[0_0_15px_rgba(79,124,255,0.4)]">
                        {workspace?.name?.charAt(0)?.toUpperCase() ?? "S"}
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 overflow-hidden ml-1 flex items-center justify-between">
                            <div className="text-base font-bold truncate font-syne tracking-wide text-[#f0f0f5]">{workspace?.name ?? "SprintFlow"}</div>
                            <ChevronDown className="w-4 h-4 text-[#6b6b80] shrink-0" />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
                <div className="space-y-1.5">
                    {!isCollapsed && (
                        <div className="px-4 mb-4 text-[11px] font-bold text-[#6b6b80] uppercase tracking-[0.2em]">
                            Workspace
                        </div>
                    )}
                    {mainMenuItems.map((item) => (
                        <NavItem key={item.name} item={item} />
                    ))}
                </div>

                {projectId && (
                    <div className="space-y-1.5 pt-8 border-t border-[#333339]">
                        {!isCollapsed && (
                            <div className="px-4 mb-4 text-[11px] font-bold text-[#6b6b80] uppercase tracking-[0.2em] flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] shadow-[0_0_8px_#00d4aa]"></div>
                                Project
                            </div>
                        )}
                        {projectMenuItems.map((item) => (
                            <NavItem key={item.name} item={item} />
                        ))}
                    </div>
                )}
            </div>

            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3.5 top-8 w-7 h-7 rounded-full bg-[#18181f] border border-white/[0.1] shadow-lg flex items-center justify-center text-[#9090a8] hover:text-white hover:border-[#4f7cff]/50 transition-all duration-300 z-50 group hover:scale-110"
            >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <div className="p-5 border-t border-[#333339]">
                <div
                    className={`flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors border border-transparent hover:border-white/10 ${isCollapsed ? "justify-center" : ""
                        }`}
                >
                    <div className="w-10 h-10 rounded-xl bg-[#18181f] border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                        <Users className="w-5 h-5 text-[#6b6b80]" />
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 overflow-hidden ml-1">
                            <div className="text-sm font-semibold truncate text-[#f0f0f5]">{currentUser?.name ?? "..."}</div>
                            <div className="text-[12px] text-[#6b6b80] truncate mt-0.5">{currentUser?.email ?? ""}</div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
