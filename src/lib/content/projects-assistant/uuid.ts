import { randomUUID } from 'node:crypto';

export function generateProjectSlug(): string {
  return randomUUID();
}
