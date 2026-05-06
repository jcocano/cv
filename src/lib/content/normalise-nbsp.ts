const NON_BREAKING_SPACE_PATTERN = /\u00a0/g;

export function normaliseNbsp(value: string): string {
  return value.replace(NON_BREAKING_SPACE_PATTERN, ' ');
}
