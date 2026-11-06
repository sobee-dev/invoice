// components/products/ProductThumb.tsx
import { Icon } from "@/components/layout/Icon";

export function ProductThumb({ imageUrl, name, size = 48 }: { imageUrl?: string | null; name: string; size?: number }) {
  const box = { width: size, height: size };

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt={name} className="shrink-0 rounded-xl object-cover" style={box} />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary-container"
      style={box}
    >
      <Icon name="inventory_2" size={Math.round(size * 0.5)} />
    </span>
  );
}