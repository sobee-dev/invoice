"use client";

import { useEffect, useRef, useState } from "react";
import { PlanSummaryCard } from "@/components/billing/PlanSummaryCard";
import { Icon } from "@/components/layout/Icon";
import { useSubscriptionContext } from "@/context/SubscriptionContext";
import { isPaidActive } from "@/lib/plan";
import { errorCodeOf } from "@/lib/planLimit";
import { planBullets } from "@/lib/planDisplay";
import { ROUTES } from "@/lib/routes";
import { billingService, ComparisonRow, PaymentMethod, PlanOption, PlansResponse, PlanTier } from "@/services/billing";
import { fmtLongDate } from "@/utils/formatDate";
import { getApiErrorMessage } from "@/utils/getErrorMessage";

const CHECKOUT_HOST_SUFFIX = "paystack.com";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function billingError(err: any, fallback: string): string {
  const code = errorCodeOf(err);
  const data = err?.response?.data;

  if (code === "already_subscribed") {
    const renews = data?.renewsAt ? ` It renews on ${fmtLongDate(new Date(data.renewsAt))}.` : "";
    return `You already have an active subscription.${renews} Use Manage subscription to make changes.`;
  }
  if (code === "checkout_in_progress") return "A payment is already in progress. Finish it, or wait a few minutes and try again.";
  if (code === "billing_unavailable") return "Billing is temporarily unavailable. Please try again shortly.";
  if (code === "plan_unavailable") return "This plan is not available to buy yet.";
  if (code === "unknown_plan" || code === "unknown_interval" || code === "unknown_method") return "That plan option is not valid. Refresh the page and try again.";
  if (code === "invalid_reference" || code === "payment_not_confirmed") {
    return "We could not confirm that payment yet. It will update as soon as it clears.";
  }
  return getApiErrorMessage(err, fallback);
}

// Only follow a checkout or portal link to Paystack over https.
function isSafeCheckoutUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && url.hostname.endsWith(CHECKOUT_HOST_SUFFIX);
  } catch {
    return false;
  }
}

const METHOD_OPTIONS: { id: PaymentMethod; title: string; hint: string }[] = [
  { id: "card", title: "Card", hint: "Renews by itself" },
  { id: "transfer", title: "Bank transfer or USSD", hint: "Pay once, renew when you choose" },
];

const COMPARISON_COLUMNS: { tier: "free" | "business" | "enterprise"; name: string }[] = [
  { tier: "free", name: "Free" },
  { tier: "business", name: "Business" },
  { tier: "enterprise", name: "Enterprise" },
];

function PlanComparison({ rows }: { rows: ComparisonRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-primary">Compare plans</h2>
      <div className="mt-4 overflow-x-auto rounded-xl border border-outline-variant bg-white shadow-card">
        <table className="w-full min-w-[32rem] text-left text-body-md">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low">
              <th scope="col" className="px-4 py-3 font-semibold text-on-surface-variant">
                <span className="sr-only">Feature</span>
              </th>
              {COMPARISON_COLUMNS.map((c) => (
                <th key={c.tier} scope="col" className="px-4 py-3 font-bold text-primary">
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-outline-variant last:border-b-0">
                <th scope="row" className="px-4 py-3 font-medium text-on-surface">
                  {row.label}
                </th>
                {COMPARISON_COLUMNS.map((c) => (
                  <td key={c.tier} className="px-4 py-3 text-on-surface">
                    {row.values[c.tier]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function BillingPage() {
  const { subscription, isLoading, refresh } = useSubscriptionContext();
  const [plansData, setPlansData] = useState<PlansResponse | null>(null);
  const [plansFailed, setPlansFailed] = useState(false);
  const [interval, setInterval] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const handledReturn = useRef(false);

  const loadPlans = () => {
    setPlansFailed(false);
    billingService
      .getPlans()
      .then((data) => {
        setPlansData(data);
        setInterval((cur) => cur || data.defaultInterval);
      })
      .catch(() => setPlansFailed(true));
  };

  useEffect(loadPlans, []);

  // Paystack sends the owner back here with ?reference=... after paying.
  useEffect(() => {
    if (handledReturn.current) return;
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") ?? params.get("trxref");
    if (!reference) return;

    handledReturn.current = true;
    window.history.replaceState(null, "", ROUTES.billing);
    setConfirmingPayment(true);

    (async () => {
      // Ask the backend to check with Paystack straight away. The webhook activates the
      // plan and can arrive late, so poll the status for a short while after that.
      const first = await billingService.confirmCheckout(reference).catch(() => null);
      let confirmed = isPaidActive(first) && !first?.checkoutPending;

      for (let attempt = 0; !confirmed && attempt < 10; attempt++) {
        await sleep(3000);
        const info = await billingService.getStatus().catch(() => null);
        if (isPaidActive(info) && !info?.checkoutPending) confirmed = true;
      }

      await refresh();
      setConfirmingPayment(false);
      setNotice(
        confirmed
          ? "Payment confirmed. Your plan is active."
          : "We have not received confirmation yet. Your plan will update as soon as the payment clears.",
      );
    })();
  }, [refresh]);

  const run = async (key: string, task: () => Promise<void>, fallback: string) => {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      await task();
    } catch (err: any) {
      setError(billingError(err, fallback));
    } finally {
      setBusy(null);
    }
  };

  const choosePlan = (tier: PlanTier) =>
    run(`checkout:${tier}`, async () => {
      const session = await billingService.startCheckout(tier, interval, method);
      if (!isSafeCheckoutUrl(session.url)) throw new Error("The checkout link was not valid. Please try again.");
      window.location.href = session.url;
    }, "Could not start checkout. Please try again.");

  const manage = () =>
    run("portal", async () => {
      const { url } = await billingService.openPortal();
      if (!isSafeCheckoutUrl(url)) throw new Error("The link was not valid. Please try again.");
      window.location.href = url;
    }, "Could not open the subscription page. Please try again.");

  const paidActive = isPaidActive(subscription);
  const oneOffPlan = paidActive && subscription?.billingMethod === "one_off";
  // The backend decides: false while a card subscription is active or a payment is being confirmed.
  const canPurchase = subscription ? (subscription.canPurchase ?? !paidActive) : false;
  const paidPlans: PlanOption[] = (plansData?.plans ?? []).filter((p) => p.intervals.length > 0);
  const intervalChoices = paidPlans[0]?.intervals ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-headline-lg font-bold text-primary">Subscription</h1>
        <p className="mt-1 text-body-lg text-on-surface-variant">See your plan and usage, and choose how you pay.</p>
      </div>

      {confirmingPayment && (
        <div role="status" className="flex items-center gap-3 rounded-lg border border-outline-variant bg-white p-4 text-body-md text-on-surface">
          <Icon name="progress_activity" size={20} className="animate-spin text-primary" />
          Confirming your payment. This can take a few seconds.
        </div>
      )}

      {notice && (
        <div role="status" className="rounded-lg border border-status-paid-fg/30 bg-status-paid-bg p-4 text-body-md text-status-paid-fg">
          {notice}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg border border-[#f9b4ae] bg-error-container p-4 text-body-md text-error">
          {error}
        </div>
      )}

      {isLoading && !subscription ? (
        <div className="h-40 animate-pulse rounded-xl border border-outline-variant bg-surface-container-low" />
      ) : !subscription ? (
        <div className="rounded-xl border border-outline-variant bg-white p-6 text-center shadow-card">
          <p className="text-body-md text-on-surface-variant">We could not load your subscription.</p>
          <button
            type="button"
            onClick={() => refresh()}
            className="mt-4 h-11 rounded-lg bg-primary-container px-5 text-sm font-semibold text-white hover:bg-primary"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <PlanSummaryCard subscription={subscription} plans={plansData?.plans ?? null} />

          {oneOffPlan && subscription.currentPeriodEnd && (
            <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-card">
              <h2 className="text-xl font-bold text-primary">Paid by transfer or USSD</h2>
              <p className="mt-1 text-body-md text-on-surface-variant">
                Your plan is paid through {fmtLongDate(new Date(subscription.currentPeriodEnd))}. It does not renew by itself.
                Pay again below and the new time is added after that date.
              </p>
            </div>
          )}

          {paidActive && !oneOffPlan && (
            <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-card">
              <h2 className="text-xl font-bold text-primary">Manage</h2>
              <p className="mt-1 text-body-md text-on-surface-variant">
                Update your card, change your billing period or cancel renewal. If you cancel, you keep access until the end of the paid period.
              </p>
              <button
                type="button"
                onClick={manage}
                disabled={busy !== null}
                className="mt-4 flex h-11 items-center gap-2 rounded-lg border border-primary-container bg-white px-5 text-sm font-semibold text-primary hover:bg-surface-container-low disabled:opacity-50"
              >
                <Icon name="credit_card" size={18} />
                {busy === "portal" ? "Opening..." : "Manage subscription"}
              </button>
            </div>
          )}

          <div id="plans" className="scroll-mt-24">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-primary">{paidActive ? "Plans" : "Choose a plan"}</h2>

              {intervalChoices.length > 1 && (
                <div className="inline-flex rounded-xl bg-surface-container p-1" role="group" aria-label="Billing period">
                  {intervalChoices.map((i) => (
                    <button
                      key={i.interval}
                      type="button"
                      aria-pressed={interval === i.interval}
                      onClick={() => setInterval(i.interval)}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                        interval === i.interval ? "bg-white text-primary shadow" : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {i.label}
                      {i.discountLabel && (
                        <span className="ml-2 rounded-full bg-secondary-container px-2 py-0.5 text-[11px] font-bold text-on-secondary-container">
                          {i.discountLabel}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {canPurchase && (
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
                {METHOD_OPTIONS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={method === m.id}
                    onClick={() => setMethod(m.id)}
                    className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                      method === m.id
                        ? "border-primary-container bg-white ring-1 ring-primary-container"
                        : "border-outline-variant bg-white hover:bg-surface-container-low"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-primary">{m.title}</span>
                    <span className="block text-xs text-on-surface-variant">{m.hint}</span>
                  </button>
                ))}
              </div>
            )}

            {plansFailed ? (
              <div className="mt-4 rounded-xl border border-outline-variant bg-white p-6 text-center shadow-card">
                <p className="text-body-md text-on-surface-variant">We could not load the plans.</p>
                <button
                  type="button"
                  onClick={loadPlans}
                  className="mt-4 h-11 rounded-lg bg-primary-container px-5 text-sm font-semibold text-white hover:bg-primary"
                >
                  Try again
                </button>
              </div>
            ) : !plansData ? (
              <div className="mt-4 h-48 animate-pulse rounded-xl border border-outline-variant bg-surface-container-low" />
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {paidPlans.map((plan) => {
                  const iv = plan.intervals.find((i) => i.interval === interval) ?? plan.intervals[0];
                  const isCurrent = paidActive && subscription.plan === plan.tier;
                  const available = method === "card" ? iv.checkoutAvailable : iv.oneOffAvailable;
                  const disabled = busy !== null || confirmingPayment || !canPurchase || !available;

                  return (
                    <div
                      key={plan.tier}
                      className={`flex flex-col rounded-xl border bg-white p-6 shadow-card ${
                        isCurrent ? "border-primary-container ring-1 ring-primary-container" : "border-outline-variant"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-primary">{plan.name}</h3>
                        {iv.discountPercent > 0 && (
                          <span className="rounded-full bg-secondary-container px-2.5 py-0.5 text-[11px] font-bold text-on-secondary-container">
                            Save {iv.discountPercent}%
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-3xl font-extrabold text-on-surface">
                        {iv.monthlyEquivalentLabel}
                      </p>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        {method === "card"
                          ? `${iv.priceLabel}, renews by itself`
                          : `${iv.priceLabel} once, buys ${iv.oneOffDays} days`}
                        {iv.savingLabel ? `. ${iv.savingLabel} compared with paying monthly` : ""}
                      </p>

                      <ul className="mt-4 flex-1 space-y-2 text-body-md text-on-surface">
                        {planBullets(plan).map((b) => (
                          <li key={b} className="flex items-start gap-2">
                            <Icon name="check_circle" size={18} className="mt-0.5 shrink-0 text-primary-container" />
                            {b}
                          </li>
                        ))}
                      </ul>

                      <button
                        type="button"
                        onClick={() => choosePlan(plan.tier)}
                        disabled={disabled}
                        className="mt-6 h-11 rounded-lg bg-primary-container px-5 text-sm font-semibold text-white hover:bg-primary disabled:opacity-50"
                      >
                        {busy === `checkout:${plan.tier}`
                          ? "Opening checkout..."
                          : isCurrent && !canPurchase
                            ? "Current plan"
                            : !available
                              ? "Not available yet"
                              : isCurrent && oneOffPlan
                                ? `Renew ${plan.name}`
                                : method === "card"
                                  ? `Choose ${plan.name}`
                                  : `Pay for ${plan.name}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {paidActive && !canPurchase && (
              <p className="mt-3 text-body-md text-on-surface-variant">
                To switch plan or billing period, use Manage subscription above.
              </p>
            )}

            {plansData && <PlanComparison rows={plansData.comparison ?? []} />}
          </div>
        </>
      )}
    </div>
  );
}