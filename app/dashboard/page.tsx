import React from "react";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-[var(--color-bg)] text-[#f0f0f5] font-sans flex flex-col items-center justify-center p-8">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-16 h-16 bg-[#18181f] border border-[#333339] rounded-2xl flex items-center justify-center mx-auto text-[#4f7cff] shadow-lg mb-4">
                    <LayoutDashboard className="h-8 w-8" />
                </div>

                <h1 className="text-3xl font-bold font-syne text-[#f0f0f5]">
                    Dashboard Screen
                </h1>

                <div className="pt-8">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-6 py-3 bg-[#18181f] border border-[#333339] hover:bg-[#1f1f27] hover:border-[#4f7cff]/50 rounded-full text-sm font-medium text-[#f0f0f5] transition-all duration-200"
                    >
                        Back to Landing Page
                    </Link>
                </div>
            </div>
        </div>
    );
}
