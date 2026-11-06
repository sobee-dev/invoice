// app/(owner)/products/new/page.tsx
"use client";

import { ProductForm } from "@/components/products/ProductForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add product" subtitle="Define an item you sell or stock." backHref="/products" backLabel="Products" />
      <ProductForm />
    </div>
  );
}