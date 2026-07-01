export const PASSWORD_MIN_LENGTH = 8;

export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

export function getPasswordStrength(pw: string): PasswordStrength {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= PASSWORD_MIN_LENGTH) score++;
  if (/[a-zA-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 12) score++;
  return Math.min(4, score) as PasswordStrength;
}

/** Minimum bar for registration / password set: 8+ chars, a letter, and a digit. */
export function isPasswordStrongEnough(pw: string): boolean {
  if (pw.length < PASSWORD_MIN_LENGTH) return false;
  if (!/[a-zA-Z]/.test(pw)) return false;
  if (!/[0-9]/.test(pw)) return false;
  return true;
}

export type PasswordIssueCode =
  | "PASSWORD_TOO_SHORT"
  | "PASSWORD_NEEDS_LETTER"
  | "PASSWORD_NEEDS_NUMBER";

export function getPasswordIssueCode(pw: string): PasswordIssueCode | null {
  if (pw.length < PASSWORD_MIN_LENGTH) return "PASSWORD_TOO_SHORT";
  if (!/[a-zA-Z]/.test(pw)) return "PASSWORD_NEEDS_LETTER";
  if (!/[0-9]/.test(pw)) return "PASSWORD_NEEDS_NUMBER";
  return null;
}
