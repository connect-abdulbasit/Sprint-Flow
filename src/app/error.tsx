"use client";

import RouteErrorFallback, {
  type RouteErrorFallbackProps,
} from "@/components/ui/RouteErrorFallback";

export default function GlobalError(props: RouteErrorFallbackProps) {
  return <RouteErrorFallback {...props} />;
}
