"use client";

import RouteErrorFallback, {
  type RouteErrorFallbackProps,
} from "@/components/ui/RouteErrorFallback";

export default function WorkspaceError(props: RouteErrorFallbackProps) {
  return <RouteErrorFallback {...props} homeHref="/organizations" />;
}
