// lib/rateLimit.ts (Upstash)
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateResult {
  ok: boolean;
  retryAfter: number;
}

const redis = Redis.fromEnv();
const limiters = new Map<string, Ratelimit>();

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateResult> {
  const id = `${limit}:${windowMs}`;
  let rl = limiters.get(id);
  if (!rl) {
    rl = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`), prefix: `rl:${id}` });
    limiters.set(id, rl);
  }
  const r = await rl.limit(key);
  return { ok: r.success, retryAfter: r.success ? 0 : Math.max(1, Math.ceil((r.reset - Date.now()) / 1000)) };
}