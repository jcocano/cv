import { describe, expect, it } from 'vitest';

import { generateProjectSlug } from '@/lib/content/projects-assistant/uuid';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('generateProjectSlug', () => {
  it('returns a string matching the RFC 4122 UUID v4 shape', () => {
    const slug = generateProjectSlug();
    expect(typeof slug).toBe('string');
    expect(slug).toMatch(UUID_V4_REGEX);
  });

  it('returns 36-character lowercase identifiers', () => {
    const slug = generateProjectSlug();
    expect(slug).toHaveLength(36);
    expect(slug).toBe(slug.toLowerCase());
  });

  it('produces 1000 unique slugs across consecutive invocations', () => {
    const totalSamples = 1000;
    const generatedSlugs = new Set<string>();
    for (let sampleIndex = 0; sampleIndex < totalSamples; sampleIndex += 1) {
      generatedSlugs.add(generateProjectSlug());
    }
    expect(generatedSlugs.size).toBe(totalSamples);
  });

  it('emits version 4 (third group starts with "4") and variant bits 10xx (fourth group starts with 8, 9, a or b)', () => {
    const totalSamples = 200;
    for (let sampleIndex = 0; sampleIndex < totalSamples; sampleIndex += 1) {
      const slug = generateProjectSlug();
      const groups = slug.split('-');
      expect(groups).toHaveLength(5);
      const versionGroup = groups[2];
      const variantGroup = groups[3];
      expect(versionGroup).toBeDefined();
      expect(variantGroup).toBeDefined();
      if (versionGroup === undefined || variantGroup === undefined) {
        throw new Error('uuid groups should be defined');
      }
      expect(versionGroup.startsWith('4')).toBe(true);
      const variantFirstChar = variantGroup.charAt(0);
      expect(['8', '9', 'a', 'b']).toContain(variantFirstChar);
    }
  });
});
