// app/(staff)/staff/products/new/page.tsx
"use client";

import { ProductForm } from "@/components/products/ProductForm";
import { ManagerialGuard } from "@/components/staff/ManagerialGuard";
import { PageHeader } from "@/components/ui/PageHeader";
import { ROUTES } from "@/lib/routes";

export default function StaffNewProductPage() {
  return (
    <ManagerialGuard>
      <div className="space-y-6">
        <PageHeader
          title="Add product"
          subtitle="Define an item you sell or stock."
          backHref={ROUTES.staffProducts}
          backLabel="Products"
        />
        <ProductForm variant="staff" />
      </div>
    </ManagerialGuard>
  );
}