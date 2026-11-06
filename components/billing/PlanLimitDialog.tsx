// components/billing/PlanLimitDialog.tsx
"use client";

import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { btnNavy, btnOutline } from "@/components/ui/buttonStyles";
import { PLAN_LIMIT_MESSAGE, PlanLimitInfo } from "@/lib/planLimit";
import { ROUTES } from "@/lib/routes";

const NOUN: Record<string, string> = {
  invoices: "invoices a month",
  products: "products",
  staff: "staff members",
  branches: "branches",
};

export function PlanLimitDialog({ info, onClose }: { info: PlanLimitInfo | null; onClose: () => void }) {
  const noun = info?.resource ? NOUN[info.resource] : undefined;
  const detail = noun && typeof info?.limit === "number" ? `Your plan allows ${info.limit} ${noun}.` : null;

  return (
    <Modal
      open={info !== null}
      title="Plan limit reached"
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className={`${btnOutline} !h-12 flex-1`}>
            Not now
          </button>
          <Link href={ROUTES.billing} onClick={onClose} className={`${btnNavy} !h-12 flex-1`}>
            Review my plan
          </Link>
        </div>
      }
    >
      <p className="text-body-md text-on-surface">{PLAN_LIMIT_MESSAGE}</p>
      {detail && <p className="mt-2 text-body-md text-on-surface-variant">{detail}</p>}
    </Modal>
  );
}