import api, {
  AUTH_LAST_EMAIL_KEY,
  logout as logoutRequest,
  saveSession,
  storage,
} from "@/lib/axios";

export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload extends LoginPayload {
  firstName?: string;
  lastName?: string;
  // The server rejects registration without it.
  acceptedTerms: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'owner' | 'staff';
  firstName?: string;
  lastName?: string;
  avatarColor?: string;
  hasBusiness?: boolean;
  fullName?: string;
  permissionLevel?: 'managerial_access' | 'limited_access' | null;
  requiresPasswordChange?: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  // False for accounts that only ever signed in with Google.
  hasPassword: boolean;
}

export interface RequestDeletionResponse {
  message: string;
  deletionScheduledFor: string;
}

// On web the refresh token travels in an httpOnly cookie, so it never
// appears in the response body. sessionExpiresAt is the 14 day ceiling in ms.
export interface AuthResponse {
  access: string;
  sessionExpiresAt?: number;
  user: AuthUser;
  business?: unknown | null;
  requiresPasswordChange?: boolean;
  message?: string;
}

export interface GoogleAuthResponse extends AuthResponse {
  isNew: boolean;
}

// A 401 from an auth endpoint means wrong credentials, not an expired
// session, so tell the axios interceptor not to attempt a refresh.
const AUTH_REQUEST_CONFIG = { _retry: true } as any;

/**
 * A new Google account must accept the terms first. The server answers the
 * first Google call with 403 { code: "terms_required", signupToken }.
 * Returns that token, or null for any other error.
 */
export function termsRequiredToken(err: unknown): string | null {
  const e = err as any;
  if (e?.response?.status === 403 && e?.response?.data?.code === "terms_required") {
    return e.response.data.signupToken ?? null;
  }
  return null;
}

// Access token goes in memory, the refresh token is already in the cookie
// Django set, and the session deadline goes to localStorage.
async function startSession(
  data: { access: string; sessionExpiresAt?: number },
  email?: string,
) {
  await saveSession(data.access, data.sessionExpiresAt);
  if (email) await storage.setItem(AUTH_LAST_EMAIL_KEY, email.trim().toLowerCase());
}

export const authService = {
  /** Email + password login. Starts a cookie backed session on success. */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const body = { ...payload, email: payload.email.trim().toLowerCase() };
    const { data } = await api.post<AuthResponse>('/api/users/login/', body, AUTH_REQUEST_CONFIG);
    await startSession(data, body.email);
    return data;
  },

  /** Create a new owner account. The server requires acceptedTerms: true. */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const body = { ...payload, email: payload.email.trim().toLowerCase() };
    const { data } = await api.post<AuthResponse>('/api/users/register/', body, AUTH_REQUEST_CONFIG);
    await startSession(data, body.email);
    return data;
  },

  /**
   * Web only: exchanges a Google authorization code. For a brand new email this
   * rejects with 403 terms_required; use termsRequiredToken(err) on the error.
   */
  async googleLogin(code: string): Promise<GoogleAuthResponse> {
    const { data } = await api.post<GoogleAuthResponse>(
      '/api/users/google_web/',
      { code },
      AUTH_REQUEST_CONFIG,
    );
    await startSession(data, data.user?.email);
    return data;
  },

  /** Second step of a new Google sign-up, after the person accepted the terms. */
  async completeGoogleSignup(signupToken: string): Promise<GoogleAuthResponse> {
    const { data } = await api.post<GoogleAuthResponse>(
      '/api/users/google_web/',
      { signupToken, acceptedTerms: true },
      AUTH_REQUEST_CONFIG,
    );
    await startSession(data, data.user?.email);
    return data;
  },

  /** Logout. Django blacklists the cookie's refresh token and clears the cookie,
   *  and local state is cleared even if the request fails. */
  async logout(): Promise<void> {
    await logoutRequest();
  },

  /** Fetch current user profile */
  async me(): Promise<AuthUser> {
    const { data } = await api.get<AuthUser>('/api/users/me/');
    return data;
  },

  /** Change password (old password not needed on a first login) */
  async changePassword(oldPassword: string | undefined, newPassword: string): Promise<void> {
    await api.post('/api/users/change_password/', {
      oldPassword: oldPassword || undefined,
      newPassword,
      newPasswordConfirm: newPassword,
    });
  },

  /** Self-service deletion for accounts that have a password. Password re-entry required. */
  async requestAccountDeletion(password: string, reason?: string): Promise<RequestDeletionResponse> {
    const { data } = await api.post<RequestDeletionResponse>('/api/users/request_account_deletion/', {
      password,
      reason: reason || '',
    });
    return data;
  },

  /** Self-service deletion for Google only accounts. The code comes from a fresh
   *  Google sign in started with purpose "delete_account". */
  async requestAccountDeletionWithGoogle(googleCode: string, reason?: string): Promise<RequestDeletionResponse> {
    const { data } = await api.post<RequestDeletionResponse>('/api/users/request_account_deletion/', {
      googleCode,
      reason: reason || '',
    });
    return data;
  },

  /** Reactivate a pending deletion account within its grace period. Django logs the user straight back in. */
  async cancelAccountDeletion(email: string, password: string): Promise<AuthResponse> {
    const normalized = email.trim().toLowerCase();
    const { data } = await api.post<AuthResponse>(
      '/api/users/cancel_account_deletion/',
      { email: normalized, password },
      AUTH_REQUEST_CONFIG,
    );
    await startSession(data, normalized);
    return data;
  },

  /** Same as above for Google accounts. The email comes from Google, not from the form. */
  async cancelAccountDeletionWithGoogle(googleCode: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>(
      '/api/users/cancel_account_deletion/',
      { googleCode },
      AUTH_REQUEST_CONFIG,
    );
    await startSession(data, data.user?.email);
    return data;
  },

  /** Update email and push notification preferences */
  async updateNotifications(
    emailNotifications: boolean,
    pushNotifications: boolean,
  ): Promise<void> {
    await api.patch('/api/users/update_notifications/', {
      emailNotifications,
      pushNotifications,
    });
  },

  /** Mark the signed in user's email as verified */
  async verifyEmail(token: string): Promise<void> {
    await api.post('/api/users/verify_email/', { token });
  },

  async requestPasswordReset(email: string): Promise<void> {
    await api.post('/api/users/password_reset/request/', { email });
  },
};