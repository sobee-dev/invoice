// utils/getErrorMessage.ts
import axios from "axios";
import { errorCodeOf, FEATURE_LOCKED_CODE, FEATURE_LOCKED_MESSAGE, PLAN_LIMIT_CODE, PLAN_LIMIT_MESSAGE } from "@/lib/planLimit";

const DEFAULT_FALLBACK = "Something went wrong. Please try again.";

const pick = (value: unknown): string | null => {
  if (typeof value === "string" && value) return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
};

const RESERVED_KEYS = ["detail", "error", "message", "nonFieldErrors", "__all__", "code"];

export const getErrorCode = errorCodeOf;

export function getErrorMessage(err: any, fallback: string = DEFAULT_FALLBACK): string {
  // Not an axios error at all. This is a bug in our own code, such as a
  // missing provider or a typo, so never describe it as a network problem.
  if (!axios.isAxiosError(err)) {
    console.error("[getErrorMessage] non-axios error:", err);
    if (process.env.NODE_ENV === "development" && err instanceof Error && err.message) {
      return err.message;
    }
    return fallback;
  }

  // Axios error, but the server never answered.
  if (!err.response) {
    if (err.code === "ECONNABORTED") {
      return "The request timed out. Please try again.";
    }
    return "Cannot connect to the server. Check your internet connection and try again.";
  }

  if (err.response.status === 429) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  // Plan rules read the same on every screen.
  const planCode = errorCodeOf(err);
  if (planCode === PLAN_LIMIT_CODE) return PLAN_LIMIT_MESSAGE;
  if (planCode === FEATURE_LOCKED_CODE) return FEATURE_LOCKED_MESSAGE;

  const data = err.response.data;
  if (!data || typeof data !== "object") return fallback;

  // DRF model level errors, for example a unique_together failure.
  const modelLevel = pick(data.__all__);
  if (modelLevel) return modelLevel;

  // Plain messages: detail (permission, 404, throttle), error (our login view),
  // message, and non field errors.
  const direct =
    pick(data.detail) ??
    pick(data.error) ??
    pick(data.message) ??
    pick(data.nonFieldErrors);
  if (direct) return direct;

  // First field level error, for example { email: ["already exists"] }.
  // Nested row errors keep their field names so the user can tell which row failed.
  for (const [field, value] of Object.entries(data)) {
    if (RESERVED_KEYS.includes(field)) continue;

    const flat = pick(value);
    if (flat) return flat;

    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry && typeof entry === "object") {
          const nested = Object.entries(entry).find(
            ([, v]) => Array.isArray(v) && typeof v[0] === "string"
          );
          if (nested) {
            const [nestedField, nestedMessages] = nested as [string, string[]];
            return `${field}.${nestedField}: ${nestedMessages[0]}`;
          }
        }
      }
    }
  }

  return fallback;
}

// Alias so pages that already call getApiErrorMessage only need a new import path.
export const getApiErrorMessage = getErrorMessage;