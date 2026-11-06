// components/dashboard/InventorySyncCard.tsx
import Link from "next/link";
import { Icon } from "@/components/layout/Icon";

interface InventorySyncCardProps {
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
}

export function InventorySyncCard({ title, description, ctaLabel, href }: InventorySyncCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-primary p-6 text-white shadow-card">
      <Icon
        name="check_box"
        size={120}
        filled
        className="pointer-events-none absolute -bottom-6 -right-4 text-white/10"
      />
      <h2 className="relative text-2xl font-bold">{title}</h2>
      <p className="relative mt-3 max-w-[88%] text-body-lg text-primary-fixed">{description}</p>
      <Link
        href={href}
        className="relative mt-5 inline-flex h-11 items-center rounded-lg bg-white px-5 text-sm font-semibold text-primary transition-colors hover:bg-primary-fixed"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}