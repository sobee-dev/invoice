// lib/rateLimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateResult {
  ok: boolean;
  retryAfter: number; // seconds
}

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;
if (!redis) console.warn("rateLimit: no Upstash credentials found, using the in-memory limiter");

const limiters = new Map<string, Ratelimit>();

// Fallback: per server instance only, so weaker on serverless, but never down.
const hits = new Map<string, number[]>();

function memoryLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false, retryAfter: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)) };
  }

  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return { ok: true, retryAfter: 0 };
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateResult> {
  if (redis) {
    try {
      const id = `${limit}:${windowMs}`;
      let rl = limiters.get(id);
      if (!rl) {
        rl = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`), prefix: `rl:${id}` });
        limiters.set(id, rl);
      }
      const r = await rl.limit(key);
      return { ok: r.success, retryAfter: r.success ? 0 : Math.max(1, Math.ceil((r.reset - Date.now()) / 1000)) };
    } catch (err) {
      console.error("rateLimit: Upstash failed, using the in-memory limiter", err);
    }
  }
  return memoryLimit(key, limit, windowMs);
}