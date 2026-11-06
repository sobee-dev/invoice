// components/dashboard/TopCustomers.tsx
import { Icon } from "@/components/layout/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { fmtMoney } from "@/utils/money";

export interface TopCustomerItem {
  id: string;
  name: string;
  total: number;
  trend?: "up" | "flat" | "down";
}

const TREND_ICON = {
  up: { name: "trending_up", color: "text-status-paid-fg" },
  down: { name: "trending_down", color: "text-error" },
  flat: { name: "remove", color: "text-outline" },
} as const;

export function TopCustomers({ customers, symbol }: { customers: TopCustomerItem[]; symbol: string }) {
  const top = customers.slice(0, 3);

  return (
    <section className="rounded-xl border border-outline-variant/50 bg-white p-6 shadow-card">
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Top Customers</h2>

      {top.length === 0 ? (
        <p className="mt-4 text-body-md text-on-surface-variant">No customers yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {top.map((c) => {
            const trend = c.trend ? TREND_ICON[c.trend] : null;
            return (
              <li key={c.id} className="flex items-center gap-3">
                <Avatar name={c.name} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-primary">{c.name}</p>
                  <p className="text-xs text-on-surface-variant">{fmtMoney(c.total, symbol)} Total</p>
                </div>
                {trend && <Icon name={trend.name} size={18} className={trend.color} />}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}