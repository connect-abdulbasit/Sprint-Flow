"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";

export interface RouteErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Where "Go back" should send the user; defaults to the organizations list. */
  homeHref?: string;
}

/**
 * Shared UI for every route-segment error.tsx boundary. AUD-016: the app previously had
 * no error.tsx anywhere, so an uncaught render exception on any page fell through to
 * Next's default full-page crash screen instead of a scoped, recoverable error.
 */
export default function RouteErrorFallback({
  error,
  reset,
  homeHref = "/organizations",
}: RouteErrorFallbackProps) {
  useEffect(() => {
    console.error("Route error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
        <AlertTriangle className="h-6 w-6 text-red-400" aria-hidden />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold text-zinc-100">Something went wrong</h2>
        <p className="max-w-md text-[13px] leading-relaxed text-zinc-500">
          This page hit an unexpected error. You can try again, or head back and pick up where you
          left off.
        </p>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2.5 text-[13px] font-semibold text-zinc-950 hover:bg-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Try again
        </button>
        <Link
          href={homeHref}
          className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-[13px] font-medium text-zinc-400 no-underline hover:bg-white/[0.05] hover:text-zinc-200"
        >
          Go back
        </Link>
      </div>
    </div>
  );
}
