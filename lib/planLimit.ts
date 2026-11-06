// lib/planLimit.ts
export const PLAN_LIMIT_CODE = "plan_limit_reached";
export const FEATURE_LOCKED_CODE = "plan_feature_locked";
export const STAFF_OVER_LIMIT_CODE = "staff_over_plan_limit";

export const PLAN_LIMIT_MESSAGE = "Exceeded account's limit. Review your plan to keep creating.";
export const FEATURE_LOCKED_MESSAGE = "This feature is not included in your plan.";
export const STAFF_OVER_LIMIT_NOTICE =
  "Your business has more staff than its plan allows, so this sign in is paused. Ask the owner to review the plan.";

export interface PlanLimitInfo {
  resource?: string;
  limit?: number | null;
  current?: number;
  plan?: string;
}

// The backend sends { error, code, ... }, so the code sits at the top level.
export function errorCodeOf(err: any): string | null {
  const d = err?.response?.data;
  const code = d?.code ?? d?.error?.code ?? d?.detail?.code;
  return typeof code === "string" ? code : null;
}

export const isPlanLimitError = (err: any) => errorCodeOf(err) === PLAN_LIMIT_CODE;

export function planLimitInfoFrom(err: any): PlanLimitInfo {
  const d = err?.response?.data ?? {};
  return { resource: d.resource, limit: d.limit, current: d.current, plan: d.plan };
}

// Same pub/sub pattern as the session expired handler in axios.
type Handler = (info: PlanLimitInfo) => void;
let onPlanLimit: Handler | null = null;

export function setPlanLimitHandler(handler: Handler | null) {
  onPlanLimit = handler;
}

export function notifyPlanLimit(info: PlanLimitInfo) {
  onPlanLimit?.(info);
}