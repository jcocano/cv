import { describe, expect, it } from 'vitest';

import { siteStatusSchema } from '@/lib/schemas/site-status';

const validStatus = {
  build_sha: 'abcdef0123456789abcdef0123456789abcdef01',
  build_time: '2026-05-04T23:35:30Z',
  schema_version: '1.0.0',
  page_weight_kb: 320.5,
  js_payload_kb: 128.25,
  css_payload_kb: 64,
  routes_count: 12,
} as const;

describe('siteStatusSchema', () => {
  it('parses a valid status entry with the seven canonical fields', () => {
    const parsed = siteStatusSchema.parse(validStatus);
    expect(parsed.build_sha).toBe('abcdef0123456789abcdef0123456789abcdef01');
    expect(parsed.build_time).toBe('2026-05-04T23:35:30Z');
    expect(parsed.schema_version).toBe('1.0.0');
    expect(parsed.page_weight_kb).toBe(320.5);
    expect(parsed.js_payload_kb).toBe(128.25);
    expect(parsed.css_payload_kb).toBe(64);
    expect(parsed.routes_count).toBe(12);
  });

  it('parses a 7-character truncated sha (lower bound of the regex)', () => {
    const parsed = siteStatusSchema.parse({ ...validStatus, build_sha: 'abc1234' });
    expect(parsed.build_sha).toBe('abc1234');
  });

  it('fails when build_sha contains uppercase letters (lowercase hex only)', () => {
    const result = siteStatusSchema.safeParse({ ...validStatus, build_sha: 'ABC1234' });
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const shaIssues = result.error.issues.filter((issue) => issue.path[0] === 'build_sha');
    expect(shaIssues.length).toBeGreaterThan(0);
  });

  it('fails when build_sha is shorter than 7 characters', () => {
    const result = siteStatusSchema.safeParse({ ...validStatus, build_sha: 'abc123' });
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const shaIssues = result.error.issues.filter((issue) => issue.path[0] === 'build_sha');
    expect(shaIssues.length).toBeGreaterThan(0);
  });

  it('fails when build_time is not a valid ISO 8601 datetime', () => {
    const result = siteStatusSchema.safeParse({ ...validStatus, build_time: '2026-05-04' });
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const timeIssues = result.error.issues.filter((issue) => issue.path[0] === 'build_time');
    expect(timeIssues.length).toBeGreaterThan(0);
  });

  it('fails when schema_version is not semver-shaped', () => {
    const result = siteStatusSchema.safeParse({ ...validStatus, schema_version: '1.0' });
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const versionIssues = result.error.issues.filter((issue) => issue.path[0] === 'schema_version');
    expect(versionIssues.length).toBeGreaterThan(0);
  });

  it('fails when page_weight_kb is negative (nonnegative requirement)', () => {
    const result = siteStatusSchema.safeParse({ ...validStatus, page_weight_kb: -1 });
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issues = result.error.issues.filter((issue) => issue.path[0] === 'page_weight_kb');
    expect(issues.length).toBeGreaterThan(0);
  });

  it('fails when js_payload_kb is negative', () => {
    const result = siteStatusSchema.safeParse({ ...validStatus, js_payload_kb: -0.01 });
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issues = result.error.issues.filter((issue) => issue.path[0] === 'js_payload_kb');
    expect(issues.length).toBeGreaterThan(0);
  });

  it('fails when css_payload_kb is negative', () => {
    const result = siteStatusSchema.safeParse({ ...validStatus, css_payload_kb: -10 });
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issues = result.error.issues.filter((issue) => issue.path[0] === 'css_payload_kb');
    expect(issues.length).toBeGreaterThan(0);
  });

  it('fails when routes_count is a non-integer (must be int)', () => {
    const result = siteStatusSchema.safeParse({ ...validStatus, routes_count: 12.5 });
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issues = result.error.issues.filter((issue) => issue.path[0] === 'routes_count');
    expect(issues.length).toBeGreaterThan(0);
  });

  it('rejects an unknown extra field in strict mode', () => {
    const broken: Record<string, unknown> = { ...validStatus, extraField: 'nope' };
    const result = siteStatusSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const unrecognized = result.error.issues.filter(
      (issue): issue is typeof issue & { keys: string[] } =>
        issue.code === 'unrecognized_keys' && Array.isArray((issue as { keys?: unknown }).keys),
    );
    expect(unrecognized.length).toBeGreaterThan(0);
    expect(unrecognized[0]?.keys).toContain('extraField');
  });
});
