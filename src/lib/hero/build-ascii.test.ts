import { describe, expect, it } from 'vitest';

import { buildAscii } from '@/lib/hero/build-ascii';

const DEFAULT_CHARS = '▓▒░·  ';

function expectedCellAt(row: number, col: number, chars: string): string {
  const index = (row * 7 + col * 3) % chars.length;
  const cell = chars[index];
  if (cell === undefined) {
    throw new Error('chars must be non-empty');
  }
  return cell;
}

describe('buildAscii', () => {
  it('returns an empty string when rows is 0', () => {
    expect(buildAscii(80, 0)).toBe('');
  });

  it('returns an empty string when cols is 0', () => {
    expect(buildAscii(0, 60)).toBe('');
  });

  it('returns an empty string when both rows and cols are 0', () => {
    expect(buildAscii(0, 0)).toBe('');
  });

  it('produces exactly rows newline-terminated lines of cols characters each', () => {
    const cols = 5;
    const rows = 3;
    const result = buildAscii(cols, rows);
    const lines = result.split('\n');
    expect(lines).toHaveLength(rows + 1);
    expect(lines[lines.length - 1]).toBe('');
    for (let lineIndex = 0; lineIndex < rows; lineIndex += 1) {
      const line = lines[lineIndex];
      if (line === undefined) {
        throw new Error('expected line to be defined');
      }
      expect([...line]).toHaveLength(cols);
    }
  });

  it('is deterministic: same inputs produce the same output across calls', () => {
    expect(buildAscii(8, 4)).toBe(buildAscii(8, 4));
    expect(buildAscii(80, 60)).toBe(buildAscii(80, 60));
  });

  it('follows the handoff formula chars[(r * 7 + c * 3) % chars.length] with defaults', () => {
    const cols = 6;
    const rows = 4;
    const result = buildAscii(cols, rows);
    const lines = result.split('\n');
    for (let row = 0; row < rows; row += 1) {
      const line = lines[row];
      if (line === undefined) {
        throw new Error(`expected line ${row.toString()} to be defined`);
      }
      const cells = [...line];
      for (let col = 0; col < cols; col += 1) {
        expect(cells[col]).toBe(expectedCellAt(row, col, DEFAULT_CHARS));
      }
    }
  });

  it('respects a custom chars string', () => {
    const cols = 4;
    const rows = 3;
    const customChars = 'AB';
    const result = buildAscii(cols, rows, customChars);
    const lines = result.split('\n');
    for (let row = 0; row < rows; row += 1) {
      const line = lines[row];
      if (line === undefined) {
        throw new Error(`expected line ${row.toString()} to be defined`);
      }
      const cells = [...line];
      for (let col = 0; col < cols; col += 1) {
        expect(cells[col]).toBe(expectedCellAt(row, col, customChars));
      }
    }
  });

  it('matches the handoff first row exactly for cols=10 with default chars', () => {
    const result = buildAscii(10, 1);
    const expectedFirstRow =
      expectedCellAt(0, 0, DEFAULT_CHARS) +
      expectedCellAt(0, 1, DEFAULT_CHARS) +
      expectedCellAt(0, 2, DEFAULT_CHARS) +
      expectedCellAt(0, 3, DEFAULT_CHARS) +
      expectedCellAt(0, 4, DEFAULT_CHARS) +
      expectedCellAt(0, 5, DEFAULT_CHARS) +
      expectedCellAt(0, 6, DEFAULT_CHARS) +
      expectedCellAt(0, 7, DEFAULT_CHARS) +
      expectedCellAt(0, 8, DEFAULT_CHARS) +
      expectedCellAt(0, 9, DEFAULT_CHARS);
    expect(result).toBe(`${expectedFirstRow}\n`);
  });

  it('throws a clear error when chars is the empty string', () => {
    expect(() => buildAscii(4, 4, '')).toThrow(/chars/);
  });

  it('throws when cols is negative', () => {
    expect(() => buildAscii(-1, 4)).toThrow(/cols/);
  });

  it('throws when rows is negative', () => {
    expect(() => buildAscii(4, -1)).toThrow(/rows/);
  });

  it('throws when cols is not an integer', () => {
    expect(() => buildAscii(4.5, 4)).toThrow(/cols/);
  });
});
