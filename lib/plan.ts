// lib/plan.ts
import type { PlanTier, ResourceKey, SubscriptionInfo } from '@/services/billing';

export type Sub = SubscriptionInfo | null;

export const DEFAULT_TEMPLATE_ID = 'classic';
export const TRIAL_DAYS = 15; // mirrors TRIAL_DAYS in billing/plans.py

export const isFreePlan = (s: Sub) => s?.plan === 'free';
export const isPaidActive = (s: Sub) =>
  (s?.plan === 'business' || s?.plan === 'enterprise') && s.status === 'active';

// Soft guard. It never blocks while the plan is unknown, the backend is the real enforcer.
export function canCreate(s: Sub, resource: ResourceKey): boolean {
  if (!s) return true;
  const limit = s.limits[resource];
  if (limit === null || limit === undefined) return true;
  return s.usage[resource] < limit;
}

export const canUseStaff = (s: Sub) => !s || s.limits.staff === null || s.limits.staff > 0;

export const showAds = (s: Sub) => isFreePlan(s);

// Templates follow the feature flag the backend sends, not the plan name.
export const allowedTemplates = (s: Sub): string[] | null => s?.features?.templates ?? null;

export function isTemplateLocked(s: Sub, templateId: string): boolean {
  const allowed = allowedTemplates(s);
  return !!allowed && !allowed.includes(templateId);
}

// What actually renders, whatever is saved on the business.
export function effectiveTemplateId(s: Sub, saved: string | undefined): string {
  const id = saved || DEFAULT_TEMPLATE_ID;
  const allowed = allowedTemplates(s);
  return allowed && !allowed.includes(id) ? allowed[0] ?? DEFAULT_TEMPLATE_ID : id;
}

const NOUN: Record<ResourceKey, [string, string]> = {
  invoices: ['invoice', 'invoices'],
  products: ['product', 'products'],
  staff: ['staff member', 'staff members'],
  branches: ['branch', 'branches'],
};

// "3 of 5 invoices used this month"
export function usageLine(s: Sub, resource: ResourceKey): string | null {
  if (!s) return null;
  const [one, many] = NOUN[resource];
  const used = s.usage[resource];
  const limit = s.limits[resource];
  const month = resource === 'invoices' ? ' this month' : '';
  if (limit === null || limit === undefined) return `${used} ${used === 1 ? one : many}${month}`;
  return `${used} of ${limit} ${many} used${month}`;
}

export type TrialLevel = 'soft' | 'strong' | 'final';

// Soft above 5 days left, strong at 5 or fewer, final at 1 or fewer.
export function trialLevel(s: Sub): TrialLevel | null {
  if (!s || s.plan !== 'trial' || s.daysLeftInTrial === null || s.daysLeftInTrial === undefined) return null;
  if (s.daysLeftInTrial <= 1) return 'final';
  if (s.daysLeftInTrial <= 5) return 'strong';
  return 'soft';
}

export function nextTier(plan: PlanTier): PlanTier | null {
  if (plan === 'free' || plan === 'trial') return 'business';
  if (plan === 'business') return 'enterprise';
  return null;
}