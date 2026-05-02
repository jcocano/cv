import { z } from 'zod';

import stackJson from '@/data/stack.json';
import { i18nString } from '@/lib/schemas/i18n-string';

export const stackCategorySchema = z
  .object({
    label: i18nString,
    tags: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const stackSchema = z
  .object({
    categories: z.array(stackCategorySchema).min(1),
  })
  .strict();

export type StackCategory = z.infer<typeof stackCategorySchema>;
export type Stack = z.infer<typeof stackSchema>;

/**
 * Parses the canonical `src/data/stack.json` singleton with `stackSchema` and
 * returns the validated `Stack`. Throws (via `parse`) when the JSON does not
 * match the schema — keeps the failure mode loud so a malformed source file
 * surfaces at build time rather than silently rendering garbage.
 */
export function getStack(): Stack {
  return stackSchema.parse(stackJson);
}
