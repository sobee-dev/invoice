// components/ui/PageHeader.tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/layout/Icon";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, backHref, backLabel = "Back", actions }: PageHeaderProps) {
  return (
    <div>
      {backHref && (
        <Link href={backHref} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-container hover:underline">
          <Icon name="arrow_back" size={18} /> {backLabel}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="break-words text-xl font-bold text-primary sm:text-headline-lg">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-on-surface-variant sm:text-body-lg">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </div>
  );
}