/**
 * Computes the eyebrow string for a card in /the-system/ as `<prefix>.<NN>`,
 * where `NN` is a one-based, zero-padded order (`01`, `02`, …, `09`, `10`, …).
 *
 * The prefix and the JSON eyebrow text are kept separate on purpose: the
 * prefix (P / D / T) and order are derived from the array position at render
 * time, the human-readable eyebrow text lives in the JSON entry itself.
 *
 * @param prefix Single uppercase letter (or arbitrary string) used as the
 *   visual namespace of the card group ("P" for principles, "D" for design
 *   decisions, "T" for technical decisions). The exact prefix is preserved;
 *   the helper does not upper-case or lower-case it.
 * @param index Zero-based position of the entry in its parent array. Must be
 *   a non-negative integer.
 * @returns The composed eyebrow string, e.g. `P.01`, `D.10`, `T.100`.
 * @throws Error when `prefix` is empty or `index` is negative or not an
 *   integer. The helper fails loud on bad input rather than silently
 *   producing a malformed eyebrow.
 */
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
