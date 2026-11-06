// components/dashboard/StatCard.tsx
import { Icon } from "@/components/layout/Icon";
import { Badge, BadgeTone } from "@/components/ui/Badge";

interface StatCardProps {
  icon: string;
  iconBg: string;     // a Tailwind background class
  iconColor: string;  // a Tailwind text color class
  label: string;
  value: string;
  sub: string;
  badge?: { text: string; tone: BadgeTone };
}

export function StatCard({ icon, iconBg, iconColor, label, value, sub, badge }: StatCardProps) {
  return (
    <div className="rounded-xl border border-outline-variant/50 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div className={`flex h-[52px] w-[52px] items-center justify-center rounded-xl ${iconBg}`}>
          <Icon name={icon} size={26} className={iconColor} />
        </div>
        {badge && <Badge tone={badge.tone}>{badge.text}</Badge>}
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-tight text-primary">{value}</p>
      <p className="mt-2 min-h-4 text-xs text-on-surface-variant">{sub}</p>
    </div>
  );
}