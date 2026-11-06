// components/ui/EmptyState.tsx
import type { ReactNode } from "react";
import { Icon } from "@/components/layout/Icon";

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <Icon name={icon} size={40} className="text-outline" />
      <p className="text-body-lg font-semibold text-on-surface">{title}</p>
      {description && <p className="max-w-sm text-body-md text-on-surface-variant">{description}</p>}
      {action}
    </div>
  );
}