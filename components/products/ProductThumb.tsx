// components/products/ProductThumb.tsx
import type { CSSProperties } from "react";
import { Icon } from "@/components/layout/Icon";

export function ProductThumb({
  imageUrl,
  name,
  size = 48,
  mobileSize,
}: {
  imageUrl?: string | null;
  name: string;
  size?: number;
  // Optional smaller size used below the sm breakpoint.
  mobileSize?: number;
}) {
  const small = mobileSize ?? size;
  const box = {
    "--thumb-mobile": `${small}px`,
    "--thumb-desktop": `${size}px`,
  } as CSSProperties;
  const boxClasses = "h-[var(--thumb-mobile)] w-[var(--thumb-mobile)] sm:h-[var(--thumb-desktop)] sm:w-[var(--thumb-desktop)]";

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt={name} className={`shrink-0 rounded-xl object-cover ${boxClasses}`} style={box} />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary-container ${boxClasses}`}
      style={box}
    >
      <Icon name="inventory_2" size={Math.round(small * 0.5)} />
    </span>
  );
}