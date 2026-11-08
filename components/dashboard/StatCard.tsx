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
  /** "alert" = red card, "success" = green card (same as the mobile app). Omit for the normal white card. */
  tone?: "default" | "alert" | "success";
}

// Full class strings so Tailwind can see them.
const TONE = {
  default: { card: "border border-outline-variant/50 bg-white", label: "text-on-surface-variant", value: "text-primary" },
  alert:   { card: "border-[1.5px] border-error bg-[#fff0f0]",     label: "text-error",             value: "text-error" },
  success: { card: "border-[1.5px] border-[#2e7d32] bg-[#e8f5e9]", label: "text-[#2e7d32]",         value: "text-[#2e7d32]" },
} as const;

// The base classes are your original desktop styles, untouched.
// Everything prefixed `max-sm:` only applies below 640px (mobile).
export function StatCard({ icon, iconBg, iconColor, label, value, sub, badge, tone = "default" }: StatCardProps) {
  const t = TONE[tone];
  return (
    <div className={`rounded-xl ${t.card} p-5 shadow-card max-sm:min-w-0 max-sm:p-3`}>
      <div className="flex items-start justify-between max-sm:gap-1.5">
        <div
          className={`flex h-[52px] w-[52px] items-center justify-center rounded-xl ${iconBg} max-sm:h-9 max-sm:w-9 max-sm:shrink-0 max-sm:rounded-lg`}
        >
          {/* Desktop icon: `contents` means this wrapper adds nothing to the layout */}
          <span className="contents max-sm:hidden">
            <Icon name={icon} size={26} className={iconColor} />
          </span>
          {/* Mobile icon */}
          <span className="hidden max-sm:flex">
            <Icon name={icon} size={18} className={iconColor} />
          </span>
        </div>
        {badge && (
          // Desktop: `contents` = wrapper has no effect. Mobile: caps width and shrinks the Badge's text/padding.
          <div className="contents max-sm:block max-sm:min-w-0 max-sm:max-w-[60%] max-sm:[&>*]:!whitespace-nowrap max-sm:[&>*]:!px-1.5 max-sm:[&>*]:!py-0.5 max-sm:[&>*]:!text-[9px]">
            <Badge tone={badge.tone}>{badge.text}</Badge>
          </div>
        )}
      </div>
      <p className={`mt-5 text-xs font-semibold uppercase tracking-[0.12em] ${t.label} max-sm:mt-3 max-sm:text-[10px] max-sm:tracking-[0.08em]`}>
        {label}
      </p>
      <p className={`mt-1 text-xl font-bold tracking-tight ${t.value} max-sm:mt-0.5 max-sm:break-words max-sm:text-base`}>
        {value}
      </p>
      <p className="mt-2 min-h-4 text-xs text-on-surface-variant max-sm:mt-1 max-sm:min-h-3 max-sm:text-[10px] max-sm:leading-tight">
        {sub}
      </p>
    </div>
  );
}