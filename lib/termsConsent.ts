// Holds the signed sign-up token between the OAuth callback and /accept-terms.
// sessionStorage, not the URL, so it stays out of history, logs and referrers.
const KEY = "billbuzz_signup_token";

export function stashSignupToken(token: string) {
  try { window.sessionStorage.setItem(KEY, token); } catch { /* storage blocked */ }
}

export function readSignupToken(): string | null {
  try { return window.sessionStorage.getItem(KEY); } catch { return null; }
}

export function clearSignupToken() {
  try { window.sessionStorage.removeItem(KEY); } catch { /* ignore */ }
}