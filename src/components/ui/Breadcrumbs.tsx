import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
}

/** Shared breadcrumb trail — same visual style `ProjectPageHeader` already
 * used inline (Workspace > Projects > Project), generalized for reuse on the
 * Epic Detail and All Issues screens (Project > Epic > Issue > Subtask). */
export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div className="flex items-center gap-1.5 text-[12px] font-medium">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const content = (
          <span className="flex items-center gap-1.5">
            {item.icon && <item.icon className="h-3 w-3" />}
            {item.label}
          </span>
        );
        return (
          <span key={`${item.label}-${i}`} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-muted" />}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="flex items-center gap-1.5 text-muted transition-colors hover:text-accent truncate"
              >
                {content}
              </Link>
            ) : (
              <span className={`truncate ${isLast ? "text-muted2" : "text-muted"}`}>{content}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
