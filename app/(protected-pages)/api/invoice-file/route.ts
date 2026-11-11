// app/api/invoice-file/route.ts
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import puppeteer, { Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

// Must match the installed @sparticuz/chromium-min version.
const PACK =
  "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar";

const isLocal = process.env.NODE_ENV === "development";

// Django base URL. Falls back to the one axios already uses.
const API_URL = (process.env.DJANGO_API_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(/\/+$/, "");

// Only your image host may be loaded (Cloudinary: res.cloudinary.com).
// Fonts are embedded as data: URLs, so they need no entry.
const ALLOWED_HOSTS = new Set(
  (process.env.IMAGE_PROXY_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean),
);

const MAX_HTML_BYTES = 2_000_000;
const MAX_CONCURRENT = 2; // Chromium is heavy, so cap parallel renders per server
const LIMITS = [
  { name: "minute", limit: 10, windowMs: 60_000 },
  { name: "hour", limit: 60, windowMs: 3_600_000 },
] as const;

let active = 0;

function fail(status: number, error: string, retryAfter?: number) {
  return NextResponse.json(
    { error, ...(retryAfter ? { retryAfter } : {}) },
    { status, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined },
  );
}

// ── Auth: ask Django whether this token is valid ────────────────────────────
type AuthResult = { ok: true; businessId: string } | { ok: false; status: 401 | 403 | 503 };

const authCache = new Map<string, { result: AuthResult; expires: number }>();

async function authenticate(req: Request): Promise<AuthResult> {
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.get("authorization") ?? "");
  if (!match) return { ok: false, status: 401 };
  if (!API_URL) {
    console.error("invoice-file: DJANGO_API_URL or NEXT_PUBLIC_BASE_URL is not set");
    return { ok: false, status: 503 };
  }

  // The raw token is never stored, only its hash.
  const key = createHash("sha256").update(match[1]).digest("hex");
  const now = Date.now();
  const cached = authCache.get(key);
  if (cached && cached.expires > now) return cached.result;

  let result: AuthResult;
  try {
    const res = await fetch(`${API_URL}/api/business/me/`, {
      headers: { Authorization: `Bearer ${match[1]}`, Accept: "application/json", "X-Client": "web" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const { id } = (await res.json()) as { id?: string };
      result = id ? { ok: true, businessId: id } : { ok: false, status: 403 };
    } else if (res.status === 401) {
      result = { ok: false, status: 401 };
    } else if (res.status < 500 && res.status !== 429) {
      result = { ok: false, status: 403 };
    } else {
      return { ok: false, status: 503 }; // Django is struggling, so don't cache this
    }
  } catch {
    return { ok: false, status: 503 };
  }

  if (authCache.size > 2000) {
    for (const [k, v] of authCache) if (v.expires <= now) authCache.delete(k);
    if (authCache.size > 2000) authCache.clear();
  }
  authCache.set(key, { result, expires: now + (result.ok ? 60_000 : 15_000) });
  return result;
}

// ── Font: Inter from your own public folder, cached per warm instance ───────
let interCss: string | null = null;

async function getInterCss(origin: string): Promise<string> {
  if (interCss) return interCss;
  try {
    const res = await fetch(`${origin}/fonts/Inter-Variable.woff2`);
    if (!res.ok) return ""; // falls back to the system font rather than failing
    const b64 = Buffer.from(await res.arrayBuffer()).toString("base64");
    interCss = `<style>@font-face{font-family:'Inter';font-weight:100 900;font-style:normal;src:url(data:font/woff2;base64,${b64}) format('woff2');}</style>`;
    return interCss;
  } catch {
    return "";
  }
}

function injectIntoHead(html: string, extra: string): string {
  if (!extra) return html;
  return html.includes("</head>") ? html.replace("</head>", `${extra}</head>`) : extra + html;
}

// ── Warm-up ping: caches the Chromium binary, the slow part of a cold start ─
// Point cron-job.org or UptimeRobot at /api/invoice-file?key=YOUR_WARMUP_KEY every 4-5 minutes.
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.WARMUP_KEY || key !== process.env.WARMUP_KEY) return fail(401, "Unauthorized");
  if (!isLocal) await chromium.executablePath(PACK);
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  // 1. Who is this? Cheap checks first, so bad requests cost almost nothing.
  const auth = await authenticate(req);
  if (!auth.ok) {
    const message =
      auth.status === 401
        ? "Please sign in again."
        : auth.status === 403
          ? "You are not allowed to do this."
          : "Could not verify your session. Please try again shortly.";
    return fail(auth.status, message, auth.status === 503 ? 5 : undefined);
  }

  // 2. Rate limit per business, before reading the body or starting a browser.
  for (const { name, limit, windowMs } of LIMITS) {
    const r = await rateLimit(`invoice-file:${auth.businessId}:${name}`, limit, windowMs);
    if (!r.ok) return fail(429, "You are creating files too quickly. Please wait a moment.", r.retryAfter);
  }

  // 3. Validate the input.
  if (Number(req.headers.get("content-length") ?? 0) > MAX_HTML_BYTES) {
    return fail(413, "Document too large");
  }

  let body: { html?: unknown; type?: unknown; fileName?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail(400, "Invalid JSON");
  }

  const { html, type, fileName } = body;
  if (
    typeof html !== "string" ||
    (type !== "pdf" && type !== "image") ||
    typeof fileName !== "string" ||
    !fileName
  ) {
    return fail(400, "Missing or invalid fields");
  }
  if (html.length > MAX_HTML_BYTES) return fail(413, "Document too large");

  // Keep the header value safe: no quotes, slashes or control characters.
  const safeName = fileName.replace(/[^\w.\- ]/g, "_").slice(0, 100);
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

  // 4. Cap parallel browsers on this server.
  if (active >= MAX_CONCURRENT) return fail(503, "The server is busy. Please try again in a few seconds.", 5);
  active += 1;

  let browser: Browser | undefined;
  try {
    const fontCss = await getInterCss(origin);

    browser = await puppeteer.launch({
      args: isLocal ? [] : chromium.args,
      executablePath: isLocal ? process.env.CHROME_PATH : await chromium.executablePath(PACK),
      headless: true,
    });

    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false); // invoices need no scripts

    // Block everything except data: URLs and your image host.
    await page.setRequestInterception(true);
    page.on("request", (r) => {
      const url = r.url();
      if (url.startsWith("data:") || url.startsWith("about:")) return r.continue();
      try {
        if (ALLOWED_HOSTS.has(new URL(url).hostname)) return r.continue();
      } catch {
        /* fall through to abort */
      }
      return r.abort();
    });

    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    await page.emulateMediaType(type === "pdf" ? "print" : "screen");
    await page.setContent(injectIntoHead(html, fontCss), {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const buffer =
      type === "pdf"
        ? await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true })
        : await page.screenshot({ type: "png", fullPage: true });

    const out = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;

    return new NextResponse(out, {
      headers: {
        "Content-Type": type === "pdf" ? "application/pdf" : "image/png",
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("Invoice file error:", err);
    return fail(500, "Generation failed. Please try again.");
  } finally {
    active -= 1;
    await browser?.close().catch(() => undefined);
  }
}