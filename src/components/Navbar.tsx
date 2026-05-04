"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 h-16 transition-all duration-300 border-b ${
        scrolled
          ? "bg-[#0a0a0f]/90 backdrop-blur-xl border-white/5"
          : "bg-transparent border-transparent"
      }`}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <div className="w-7 h-7 rounded-[7px] bg-gradient-to-br from-[#4f7cff] to-[#a259ff] flex items-center justify-center text-xs font-black text-white">
          SF
        </div>
        <span
          className="font-black text-lg tracking-tight text-[#f0f0f5]"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          SprintFlow
        </span>
      </Link>

      {/* CTA */}
      <div className="flex items-center gap-3">
        <Link
          href="/signin"
          className="hidden sm:block px-4 py-2 text-sm text-[#9090a8] hover:text-[#f0f0f5] hover:bg-[#18181f] rounded-lg transition-all duration-200 cursor-pointer no-underline"
        >
          Sign in
        </Link>
        <Link
          href="/signin"
          className="px-5 py-2 text-sm font-medium text-white bg-[#4f7cff] rounded-lg hover:opacity-90 hover:-translate-y-px transition-all duration-200 cursor-pointer no-underline"
        >
          Get started
        </Link>
      </div>
    </nav>
  );
}
