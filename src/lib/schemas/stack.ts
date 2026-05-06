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

export function getStack(): Stack {
  return stackSchema.parse(stackJson);
}
