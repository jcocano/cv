import { describe, expect, it } from 'vitest';

import labJson from '@/data/lab.json';
import { labSchema } from '@/lib/schemas/lab';

const validLab = {
  title: {
    es: 'Frontend también,\ncuando el backend lo pide.',
    en: 'Frontend too,\nwhen the backend asks for it.',
  },
  lede: {
    es: 'Pequeñas piezas en vivo. CSS, Canvas y un poco de matemáticas.',
    en: 'Small live pieces. CSS, Canvas, and a bit of math.',
  },
  pieces: [
    {
      key: 'kinetic',
      num: '01',
      title: { es: 'Kinetic Type', en: 'Kinetic Type' },
      description: {
        es: 'Variable font reaccionando al cursor.',
        en: 'Variable font reacting to the cursor.',
      },
      tags: ['CSS', 'variable fonts', 'pointer events'],
      words: ['distributed', 'resilient', 'observable', 'elastic', 'event-driven', 'cloud-native'],
    },
    {
      key: 'grid',
      num: '02',
      title: { es: 'Campo generativo', en: 'Generative field' },
      description: {
        es: 'Flow field con ruido Perlin simple.',
        en: 'Flow field with simple Perlin noise.',
      },
      tags: ['Canvas', 'noise', 'requestAnimationFrame'],
    },
    {
      key: 'marquee',
      num: '03',
      title: { es: 'Marquee con scrub', en: 'Scrubbable marquee' },
      description: {
        es: 'El cursor controla la velocidad y dirección.',
        en: 'Cursor drives speed and direction.',
      },
      tags: ['CSS animations', 'pointer math'],
    },
  ],
} as const;

describe('labSchema', () => {
  it('parses a valid singleton with the three pieces in order 01/02/03', () => {
    const parsed = labSchema.parse(validLab);
    expect(parsed.title.es.startsWith('Frontend')).toBe(true);
    expect(parsed.title.en.startsWith('Frontend')).toBe(true);
    expect(parsed.lede.es.startsWith('Pequeñas piezas')).toBe(true);
    expect(parsed.lede.en.startsWith('Small live pieces')).toBe(true);
    expect(parsed.pieces).toHaveLength(3);
    expect(parsed.pieces[0]?.key).toBe('kinetic');
    expect(parsed.pieces[0]?.num).toBe('01');
    expect(parsed.pieces[0]?.words).toEqual([
      'distributed',
      'resilient',
      'observable',
      'elastic',
      'event-driven',
      'cloud-native',
    ]);
    expect(parsed.pieces[1]?.key).toBe('grid');
    expect(parsed.pieces[1]?.num).toBe('02');
    expect(parsed.pieces[2]?.key).toBe('marquee');
    expect(parsed.pieces[2]?.num).toBe('03');
  });

  it('fails when pieces has only two entries (length 3 is required)', () => {
    const broken = { ...validLab, pieces: validLab.pieces.slice(0, 2) };
    const result = labSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const piecesIssues = result.error.issues.filter((issue) => issue.path[0] === 'pieces');
    expect(piecesIssues).toHaveLength(1);
    expect(piecesIssues[0]?.code).toBe('too_small');
  });

  it('fails when two pieces share the same key (no duplicates allowed)', () => {
    const broken = {
      ...validLab,
      pieces: [
        validLab.pieces[0],
        { ...validLab.pieces[1], key: 'kinetic', words: ['x', 'y', 'z', 'a', 'b', 'c'] },
        validLab.pieces[2],
      ],
    };
    const result = labSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const duplicateIssues = result.error.issues.filter((issue) =>
      issue.message.toLowerCase().includes('duplicate'),
    );
    expect(duplicateIssues.length).toBeGreaterThan(0);
  });

  it('fails when the kinetic piece is missing the words array', () => {
    const { words: _omitted, ...kineticWithoutWords } = validLab.pieces[0];
    void _omitted;
    const broken = {
      ...validLab,
      pieces: [kineticWithoutWords, validLab.pieces[1], validLab.pieces[2]],
    };
    const result = labSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const wordsIssues = result.error.issues.filter(
      (issue) => issue.path[0] === 'pieces' && issue.path[1] === 0,
    );
    expect(wordsIssues.length).toBeGreaterThan(0);
  });

  it('fails when the kinetic piece has an empty words array (at least one word required)', () => {
    const broken = {
      ...validLab,
      pieces: [{ ...validLab.pieces[0], words: [] }, validLab.pieces[1], validLab.pieces[2]],
    };
    const result = labSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const wordsIssues = result.error.issues.filter(
      (issue) => issue.path[0] === 'pieces' && issue.path[1] === 0 && issue.path[2] === 'words',
    );
    expect(wordsIssues.length).toBeGreaterThan(0);
    expect(wordsIssues[0]?.code).toBe('too_small');
  });

  it('fails when a piece title is missing the en key', () => {
    const broken = {
      ...validLab,
      pieces: [
        { ...validLab.pieces[0], title: { es: 'Kinetic Type' } },
        validLab.pieces[1],
        validLab.pieces[2],
      ],
    };
    const result = labSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const titleEnIssues = result.error.issues.filter(
      (issue) =>
        issue.path[0] === 'pieces' &&
        issue.path[1] === 0 &&
        issue.path[2] === 'title' &&
        issue.path[3] === 'en',
    );
    expect(titleEnIssues).toHaveLength(1);
  });

  it('fails when a piece has an empty tags array', () => {
    const broken = {
      ...validLab,
      pieces: [{ ...validLab.pieces[0], tags: [] }, validLab.pieces[1], validLab.pieces[2]],
    };
    const result = labSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const tagsIssues = result.error.issues.filter(
      (issue) => issue.path[0] === 'pieces' && issue.path[1] === 0 && issue.path[2] === 'tags',
    );
    expect(tagsIssues).toHaveLength(1);
    expect(tagsIssues[0]?.code).toBe('too_small');
  });

  it('rejects an extra unknown field on a piece in strict mode', () => {
    const piecesWithExtra: Array<Record<string, unknown>> = [
      { ...validLab.pieces[0], extraField: 'nope' },
      { ...validLab.pieces[1] },
      { ...validLab.pieces[2] },
    ];
    const broken: Record<string, unknown> = { ...validLab, pieces: piecesWithExtra };
    const result = labSchema.safeParse(broken);
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

  it('parses the real src/data/lab.json singleton', () => {
    const parsed = labSchema.parse(labJson);
    expect(parsed.pieces).toHaveLength(3);
    expect(parsed.pieces[0]?.key).toBe('kinetic');
    expect(parsed.pieces[0]?.words).toEqual([
      'distributed',
      'resilient',
      'observable',
      'elastic',
      'event-driven',
      'cloud-native',
    ]);
    expect(parsed.pieces[1]?.key).toBe('grid');
    expect(parsed.pieces[1]?.words).toBeUndefined();
    expect(parsed.pieces[2]?.key).toBe('marquee');
    expect(parsed.pieces[2]?.words).toBeUndefined();
  });
});
