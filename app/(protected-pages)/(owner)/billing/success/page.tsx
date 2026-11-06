"use client";

// app/billing/success/page.tsx
// Paystack sends the owner to BILLING_SUCCESS_URL after paying, with ?reference=...&trxref=... on the end.
// The billing page already confirms that payment and waits for the plan to switch on, so this route
// only hands the visit, query string included, to /billing. It exists so a payment never ends on a 404
// when BILLING_SUCCESS_URL (or an older checkout that was already started) still points here.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";

export default function BillingSuccessRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`${ROUTES.billing}${window.location.search}`);
  }, [router]);

  return (
    <p role="status" className="p-6 text-body-md text-on-surface-variant">
      Confirming your payment...
    </p>
  );
}