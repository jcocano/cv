export const TAGLINE_SOFT_LIMIT_CHARS = 80;
export const DESCRIPTION_SOFT_LIMIT_CHARS = 280;

export type SoftLimitResult = { ok: true } | { ok: false; exceededBy: number; limit: number };

function checkAgainst(limit: number, value: string): SoftLimitResult {
  const characterCount = value.length;
  if (characterCount <= limit) {
    return { ok: true };
  }
  return { ok: false, exceededBy: characterCount - limit, limit };
}

export function checkTaglineSoftLimit(value: string): SoftLimitResult {
  return checkAgainst(TAGLINE_SOFT_LIMIT_CHARS, value);
}

export function checkDescriptionSoftLimit(value: string): SoftLimitResult {
  return checkAgainst(DESCRIPTION_SOFT_LIMIT_CHARS, value);
}
