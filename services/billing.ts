// services/billing.ts
import api from '../lib/axios';

export type PlanTier = 'trial' | 'free' | 'business' | 'enterprise';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled';
export type ResourceKey = 'invoices' | 'products' | 'staff' | 'branches';

// card renews by itself. transfer is a one-off bank transfer or USSD purchase that buys a fixed number of days.
export type PaymentMethod = 'card' | 'transfer';
// How the current paid period is being paid for. null on trial and Free.
export type BillingMethod = 'card' | 'one_off' | null;

// A null limit means unlimited.
export type PlanLimits = Record<ResourceKey, number | null>;
export type PlanUsage = Record<ResourceKey, number>;

export interface PlanFeatures {
  templates: string[];
}

export interface SubscriptionInfo {
  plan:                  PlanTier;
  planName:              string;
  status:                SubscriptionStatus;
  billingInterval:       string | null;
  billingIntervalLabel:  string | null;
  billingMethod:         BillingMethod;
  limits:                PlanLimits;
  usage:                 PlanUsage;
  features:              PlanFeatures;
  daysLeftInTrial:       number | null;
  trialEndsAt:           string | null;
  currentPeriodEnd:      string | null;
  cancelAtPeriodEnd:     boolean;
  checkoutPending:       boolean;
  // False while a card subscription is active or a payment is being confirmed.
  canPurchase:           boolean;
  invoicesResetAt:       string | null;
}

export interface PlanInterval {
  interval:              string;
  label:                 string;
  months:                number;
  // Ready-made text from the backend, for example "₦72,000 / year". Never format amounts in the app.
  priceLabel:               string;
  monthlyEquivalentLabel:   string;
  savingLabel:              string | null;
  discountLabel:            string | null;
  discountPercent:          number;
  checkoutAvailable:        boolean;  // card plan is set up
  oneOffAvailable:          boolean;  // transfer or USSD
  oneOffDays:               number;   // days a transfer or USSD purchase buys
}

export interface ComparisonRow {
  key:    string;
  label:  string;
  values: Record<'free' | 'business' | 'enterprise', string>;
}

export interface PlanOption {
  tier:       PlanTier;
  name:       string;
  limits:     PlanLimits;
  features:   PlanFeatures;
  startingPriceLabel: string | null; // "₦6,000 / month", the lowest monthly equivalent. null for free
  intervals:  PlanInterval[]; // empty for free
}

export interface PlansResponse {
  plans:           PlanOption[];
  comparison:      ComparisonRow[];
  defaultInterval: string;
  trialDays:       number;
}

export interface CheckoutSession {
  url:       string;
  reference: string;
}

export const billingService = {
  async getStatus(): Promise<SubscriptionInfo> {
    const { data } = await api.get<SubscriptionInfo>('/api/billing/status/');
    return data;
  },

  async getPlans(): Promise<PlansResponse> {
    const { data } = await api.get<PlansResponse>('/api/billing/plans/');
    return data;
  },

  // Starts a checkout. The browser is then sent to url. method defaults to card.
  async startCheckout(tier: PlanTier, interval: string, method: PaymentMethod = 'card'): Promise<CheckoutSession> {
    const { data } = await api.post<CheckoutSession>('/api/billing/checkout/', { tier, interval, method });
    return data;
  },

  // After the owner is sent back. Returns the status payload. A card payment has checkoutPending
  // true until the webhook has activated the plan. A transfer or USSD payment is active at once.
  async confirmCheckout(reference: string): Promise<SubscriptionInfo> {
    const { data } = await api.post<SubscriptionInfo>('/api/billing/checkout/confirm/', { reference });
    return data;
  },

  // Paystack's manage page: card, renewal and cancellation.
  async openPortal(): Promise<{ url: string }> {
    const { data } = await api.post<{ url: string }>('/api/billing/portal/');
    return data;
  },
};