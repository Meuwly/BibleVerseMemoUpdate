const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 32;
const USERNAME_ALLOWED_PATTERN = /^[A-Za-z0-9 ._-]+$/;
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeUsernameInput(username: string): string {
  return username.trim().replace(/\s+/g, ' ');
}

export function validateUsername(username: string): string | null {
  const normalizedUsername = normalizeUsernameInput(username);

  if (normalizedUsername.length < USERNAME_MIN_LENGTH) {
    return 'Username must contain at least 3 characters';
  }

  if (normalizedUsername.length > USERNAME_MAX_LENGTH) {
    return 'Username must contain at most 32 characters';
  }

  if (!USERNAME_ALLOWED_PATTERN.test(normalizedUsername)) {
    return 'Username can only use letters, numbers, spaces, dots, underscores, and hyphens';
  }

  if (/^[._ -]|[._ -]$/.test(normalizedUsername)) {
    return 'Username cannot start or end with punctuation or spaces';
  }

  return null;
}

export function isUuid(value: string): boolean {
  return UUID_V4_PATTERN.test(value);
}
