"use client";

import { Bell, Search, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Topbar() {
    const router = useRouter();

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/signin");
    };

    return (
        <header className="h-20 flex items-center justify-between px-8 bg-transparent z-30">
            <div className="flex items-center gap-4 flex-1">
                <div className="relative w-full max-w-lg group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b80] group-focus-within:text-[#4f7cff] transition-colors" />
                    <input
                        type="text"
                        placeholder="Search tasks, projects, or people... (Press '/')"
                        className="w-full pl-11 pr-4 py-2.5 bg-[#111118]/40 backdrop-blur-xl border border-white/[0.05] rounded-2xl text-sm focus:bg-[#111118]/80 focus:ring-1 focus:ring-[#4f7cff]/50 focus:border-[#4f7cff]/50 focus:outline-none placeholder-[#6b6b80] text-[#f0f0f5] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] transition-all duration-300"
                    />
                </div>
            </div>

            <div className="flex items-center gap-5">
                <button className="p-2.5 text-[#6b6b80] hover:text-[#f0f0f5] bg-[#111118]/40 hover:bg-[#111118]/80 border border-white/[0.05] rounded-xl transition-all duration-300 relative shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
                    <Bell className="w-[18px] h-[18px]" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#ff4f7c] rounded-full shadow-[0_0_8px_#ff4f7c]"></span>
                </button>

                <button
                    onClick={handleLogout}
                    className="p-2.5 text-[#6b6b80] hover:text-[#ff4f7c] bg-[#111118]/40 hover:bg-[#111118]/80 border border-white/[0.05] rounded-xl transition-all duration-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]"
                    title="Logout"
                >
                    <LogOut className="w-[18px] h-[18px]" />
                </button>
            </div>
        </header>
    );
}