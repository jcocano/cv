/**
 * Pads a non-negative integer to a minimum width of 2 digits with a leading
 * zero, matching the design handoff convention for category counters
 * (e.g. `06`, `07`). Numbers already at or above width 2 are returned as-is
 * via `String(n)` — there is no truncation.
 *
 * Examples:
 * - `padNum(5)`   → `'05'`
 * - `padNum(10)`  → `'10'`
 * - `padNum(100)` → `'100'`
 * - `padNum(0)`   → `'00'`
 */
export function padNum(n: number): string {
  return String(n).padStart(2, '0');
}
