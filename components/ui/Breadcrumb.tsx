import { ChevronRight } from "lucide-react";
import React from "react";

import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  /** Optional icon rendered before the label. */
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm text-zinc-500 dark:text-zinc-400", className)}>
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const content = (
            <span className="flex items-center gap-1.5">
              {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
              {item.label}
            </span>
          );
          return (
            <li key={index} className="flex items-center space-x-2">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
              {isLast || !item.href ? (
                <span className={cn("flex items-center", isLast && "font-medium text-zinc-900 dark:text-zinc-100")}>
                  {content}
                </span>
              ) : (
                <a
                  href={item.href}
                  className="flex items-center transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  {content}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}