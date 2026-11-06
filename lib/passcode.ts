// lib/passcode.ts
// The mobile app only accepts a 6 digit passcode at login, so any account
// that may ever sign in on mobile needs one. Keep web in step with it.
export const PASSCODE_LENGTH = 6;

export const sanitizePasscode = (value: string) =>
  value.replace(/\D/g, "").slice(0, PASSCODE_LENGTH);

export const isValidPasscode = (value: string) => /^\d{6}$/.test(value);