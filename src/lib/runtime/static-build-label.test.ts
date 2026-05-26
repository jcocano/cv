import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getStaticBuildLabel, resolveBuildDate } from '@/lib/runtime/static-build-label';

describe('getStaticBuildLabel', () => {
  it('formats the date as YYYY.MM.DD using UTC components', () => {
    const date = new Date(Date.UTC(2026, 4, 6, 12, 30, 0));
    expect(getStaticBuildLabel(date)).toBe('2026.05.06');
  });

  it('zero-pads the month when it is single-digit', () => {
    const date = new Date(Date.UTC(2026, 0, 15, 0, 0, 0));
    expect(getStaticBuildLabel(date)).toBe('2026.01.15');
  });

  it('zero-pads the day when it is single-digit', () => {
    const date = new Date(Date.UTC(2026, 11, 1, 0, 0, 0));
    expect(getStaticBuildLabel(date)).toBe('2026.12.01');
  });

  it('zero-pads both month and day when both are single-digit', () => {
    const date = new Date(Date.UTC(2024, 1, 9, 23, 59, 59));
    expect(getStaticBuildLabel(date)).toBe('2024.02.09');
  });

  it('renders the December 31st boundary correctly', () => {
    const date = new Date(Date.UTC(2025, 11, 31, 23, 59, 59));
    expect(getStaticBuildLabel(date)).toBe('2025.12.31');
  });

  it('renders the January 1st boundary correctly', () => {
    const date = new Date(Date.UTC(2025, 0, 1, 0, 0, 0));
    expect(getStaticBuildLabel(date)).toBe('2025.01.01');
  });

  it('uses UTC components, not local-time components (regression guard)', () => {
    const utcMidnight = new Date(Date.UTC(2026, 4, 6, 0, 0, 0));
    expect(getStaticBuildLabel(utcMidnight)).toBe('2026.05.06');
    const utcLateEvening = new Date(Date.UTC(2026, 4, 6, 23, 0, 0));
    expect(getStaticBuildLabel(utcLateEvening)).toBe('2026.05.06');
  });

  it('matches the inline computation that was previously embedded in the page', () => {
    const date = new Date(Date.UTC(2026, 6, 4, 18, 0, 0));
    const inline = `${date.getUTCFullYear()}.${String(date.getUTCMonth() + 1).padStart(2, '0')}.${String(date.getUTCDate()).padStart(2, '0')}`;
    expect(getStaticBuildLabel(date)).toBe(inline);
  });
});

describe('resolveBuildDate', () => {
  const ORIGINAL_OVERRIDE = process.env.GENERATE_STATUS_BUILD_TIME;

  beforeEach(() => {
    delete process.env.GENERATE_STATUS_BUILD_TIME;
  });

  afterEach(() => {
    if (ORIGINAL_OVERRIDE === undefined) {
      delete process.env.GENERATE_STATUS_BUILD_TIME;
    } else {
      process.env.GENERATE_STATUS_BUILD_TIME = ORIGINAL_OVERRIDE;
    }
  });

  it('returns a fresh Date when GENERATE_STATUS_BUILD_TIME is unset', () => {
    const before = Date.now();
    const result = resolveBuildDate();
    const after = Date.now();
    expect(result.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.getTime()).toBeLessThanOrEqual(after);
  });

  it('parses an ISO-8601 override exactly', () => {
    process.env.GENERATE_STATUS_BUILD_TIME = '2026-05-04T17:00:00.000Z';
    const result = resolveBuildDate();
    expect(result.toISOString()).toBe('2026-05-04T17:00:00.000Z');
  });

  it('treats an empty string the same as an unset override', () => {
    process.env.GENERATE_STATUS_BUILD_TIME = '';
    const before = Date.now();
    const result = resolveBuildDate();
    const after = Date.now();
    expect(result.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.getTime()).toBeLessThanOrEqual(after);
  });

  it('feeds getStaticBuildLabel deterministically when the override is set', () => {
    process.env.GENERATE_STATUS_BUILD_TIME = '2026-05-04T17:00:00.000Z';
    expect(getStaticBuildLabel(resolveBuildDate())).toBe('2026.05.04');
  });
});
