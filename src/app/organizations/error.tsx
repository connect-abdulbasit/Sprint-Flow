"use client";

import RouteErrorFallback, {
  type RouteErrorFallbackProps,
} from "@/components/ui/RouteErrorFallback";

export default function OrganizationsError(props: RouteErrorFallbackProps) {
  return <RouteErrorFallback {...props} homeHref="/organizations" />;
}
