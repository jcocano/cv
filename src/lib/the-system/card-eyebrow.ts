export function computeCardEyebrow(prefix: string, index: number): string {
  if (prefix.length === 0) {
    throw new Error('computeCardEyebrow: prefix must be a non-empty string.');
  }
  if (!Number.isInteger(index)) {
    throw new Error('computeCardEyebrow: index must be an integer.');
  }
  if (index < 0) {
    throw new Error('computeCardEyebrow: index must be non-negative.');
  }
  const oneBased = index + 1;
  const padded = oneBased < 10 ? `0${oneBased}` : `${oneBased}`;
  return `${prefix}.${padded}`;
}
