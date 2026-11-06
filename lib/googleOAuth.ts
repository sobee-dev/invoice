// lib/googleOAuth.ts
export type GoogleOAuthPurpose = "login" | "delete_account" | "reactivate";

export const GOOGLE_OAUTH_KEYS = {
  state: "google_oauth_state",
  purpose: "google_oauth_purpose",
  reason: "google_oauth_reason",
  returnTo: "google_oauth_return_to",
  // A one time message the callback leaves for the page that started the flow.
  flash: "google_oauth_flash",
} as const;

interface StartOptions {
  purpose?: GoogleOAuthPurpose;
  reason?: string;
  returnTo?: string;
}

// Sends the browser to Google. Returns false if the app is not configured.
export function startGoogleOAuth(options: StartOptions = {}): boolean {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!clientId || !appUrl) {
    console.error("Google sign-in needs NEXT_PUBLIC_GOOGLE_CLIENT_ID and NEXT_PUBLIC_APP_URL.");
    return false;
  }

  const {
    purpose = "login",
    reason = "",
    returnTo = window.location.pathname + window.location.search,
  } = options;

  // Random value Google echoes back, checked in /oauth/callback to make sure
  // this attempt started in this browser.
  const state = crypto.randomUUID();
  sessionStorage.setItem(GOOGLE_OAUTH_KEYS.state, state);
  sessionStorage.setItem(GOOGLE_OAUTH_KEYS.purpose, purpose);
  sessionStorage.setItem(GOOGLE_OAUTH_KEYS.returnTo, returnTo);
  if (reason) {
    sessionStorage.setItem(GOOGLE_OAUTH_KEYS.reason, reason);
  } else {
    sessionStorage.removeItem(GOOGLE_OAUTH_KEYS.reason);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${appUrl}/oauth/callback`,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state,
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  return true;
}