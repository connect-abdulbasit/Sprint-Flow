"use client";

import Link from "next/link";
import { useState } from "react";

export default function SignUpForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName, email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to create account");
      }

      // Automatically redirect to dashboard after signup
      window.location.href = "/workspace/default/dashboard";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mt-12">
      <div className="flex flex-col items-center mb-8">
        <Link href="/" className="flex items-center gap-2.5 mb-6 no-underline">
          <div className="w-12 h-12 rounded-[10px] bg-gradient-to-br from-[#4f7cff] to-[#a259ff] flex items-center justify-center text-lg font-black text-white">
            SF
          </div>
          <span
            className="font-black text-2xl tracking-tight text-[#f0f0f5]"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            SprintFlow
          </span>
        </Link>

        <p className="text-[#9090a8] text-sm">Sign up to continue</p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-4 mb-6">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-[#f0f0f5] mb-2">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            className="w-full px-4 py-3 bg-[#18181f] border border-[#333339] rounded-lg text-[#f0f0f5] placeholder-[#6b6b80] focus:outline-none focus:border-[#4f7cff] focus:ring-1 focus:ring-[#4f7cff] transition-all duration-200"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#f0f0f5] mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 bg-[#18181f] border border-[#333339] rounded-lg text-[#f0f0f5] placeholder-[#6b6b80] focus:outline-none focus:border-[#4f7cff] focus:ring-1 focus:ring-[#4f7cff] transition-all duration-200"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[#f0f0f5] mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-[#18181f] border border-[#333339] rounded-lg text-[#f0f0f5] placeholder-[#6b6b80] focus:outline-none focus:border-[#4f7cff] focus:ring-1 focus:ring-[#4f7cff] transition-all duration-200 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b80] hover:text-[#9090a8] transition-colors duration-200"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.494m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-[#f0f0f5] mb-2"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-[#18181f] border border-[#333339] rounded-lg text-[#f0f0f5] placeholder-[#6b6b80] focus:outline-none focus:border-[#4f7cff] focus:ring-1 focus:ring-[#4f7cff] transition-all duration-200 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b80] hover:text-[#9090a8] transition-colors duration-200"
            >
              {showConfirmPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.494m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 px-5 py-3 text-sm font-medium text-white bg-[#4f7cff] rounded-lg hover:opacity-90 hover:-translate-y-px transition-all duration-200 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-[#333339]"></div>
        <span className="text-[#6b6b80] text-sm">Or continue with</span>
        <div className="flex-1 h-px bg-[#333339]"></div>
      </div>

      <button
        type="button"
        className="w-full px-5 py-3 text-sm font-medium text-[#f0f0f5] bg-[#18181f] border border-[#333339] rounded-lg hover:bg-[#1f1f27] hover:border-[#4f7cff] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue
      </button>

      <p className="text-center text-[#9090a8] text-sm mt-6">
        Already have an account?{" "}
        <Link
          href="/signin"
          className="text-[#4f7cff] hover:text-[#a259ff] font-medium no-underline transition-colors duration-200"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
