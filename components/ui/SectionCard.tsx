// components/ui/SectionCard.tsx
import type { ReactNode } from "react";

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  divided?: boolean;        // line under the header, used by table cards
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function SectionCard({
  title,
  subtitle,
  action,
  divided = false,
  className = "",
  bodyClassName,
  children,
}: SectionCardProps) {
  const hasHeader = Boolean(title || action);
  const body = bodyClassName ?? (hasHeader && !divided ? "px-6 pb-6 pt-4 max-sm:px-4 max-sm:pb-4 max-sm:pt-3" : "p-6 max-sm:p-4");

  return (
    <section className={`rounded-xl border border-outline-variant/50 bg-white shadow-card ${className}`}>
      {hasHeader && (
        <header
          className={`flex items-start justify-between gap-4 px-6 pt-6 max-sm:gap-2 max-sm:px-4 max-sm:pt-4 ${
            divided ? "border-b border-outline-variant pb-5 max-sm:pb-3" : ""
          }`}
        >
          <div>
            {title && <h2 className="text-xl font-bold text-primary max-sm:text-base">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-body-md text-on-surface-variant max-sm:text-xs">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={body}>{children}</div>
    </section>
  );
}