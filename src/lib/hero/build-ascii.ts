const DEFAULT_HERO_ASCII_CHARS = '▓▒░·  ';

export function buildAscii(cols: number, rows: number, chars: string = DEFAULT_HERO_ASCII_CHARS) {
  if (!Number.isInteger(cols) || cols < 0) {
    throw new Error(`buildAscii: cols must be a non-negative integer (received ${String(cols)}).`);
  }
  if (!Number.isInteger(rows) || rows < 0) {
    throw new Error(`buildAscii: rows must be a non-negative integer (received ${String(rows)}).`);
  }
  if (chars.length === 0) {
    throw new Error('buildAscii: chars must be a non-empty string.');
  }
  if (cols === 0 || rows === 0) {
    return '';
  }
  const palette = [...chars];
  let out = '';
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cell = palette[(row * 7 + col * 3) % palette.length];
      if (cell === undefined) {
        throw new Error('buildAscii: chars must be non-empty after spreading.');
      }
      out += cell;
    }
    out += '\n';
  }
  return out;
}
