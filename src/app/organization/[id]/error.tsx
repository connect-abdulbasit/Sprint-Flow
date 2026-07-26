"use client";

import RouteErrorFallback, {
  type RouteErrorFallbackProps,
} from "@/components/ui/RouteErrorFallback";

export default function OrganizationError(props: RouteErrorFallbackProps) {
  return <RouteErrorFallback {...props} homeHref="/organizations" />;
}
