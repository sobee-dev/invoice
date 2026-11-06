// app/(owner)/products/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ProductForm } from "@/components/products/ProductForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { btnNavy } from "@/components/ui/buttonStyles";
import { normalizeProduct, ProductData } from "@/lib/products";
import { productService } from "@/services/products";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let cancelled = false;
    productService
      .get(id)
      .then((p) => {
        if (cancelled) return;
        setProduct(normalizeProduct(p));
        setState("ready");
      })
      .catch(() => !cancelled && setState("failed"));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state === "loading") {
    return <div className="h-64 animate-pulse rounded-xl border border-outline-variant bg-surface-container-low" />;
  }

  if (state === "failed" || !product) {
    return (
      <div className="rounded-xl border border-outline-variant bg-white shadow-card">
        <EmptyState
          icon="cloud_off"
          title="We could not load this product"
          action={
            <Link href="/products" className={btnNavy}>
              Back to products
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit product" subtitle={product.name} backHref={`/products/${product.id}`} backLabel="Product" />
      <ProductForm key={product.id} product={product} />
    </div>
  );
}