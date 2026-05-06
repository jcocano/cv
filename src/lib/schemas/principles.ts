import { z } from 'zod';

import { i18nString } from '@/lib/schemas/i18n-string';

export const principleSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/, 'kebab-case'),
    title: i18nString,
    statement: i18nString,
    eyebrow: i18nString.optional(),
  })
  .strict();

export const principlesSchema = z
  .object({
    principles: z.array(principleSchema).min(1),
  })
  .strict()
  .refine(
    (data) => {
      const seen = new Set<string>();
      for (const principle of data.principles) {
        if (seen.has(principle.id)) {
          return false;
        }
        seen.add(principle.id);
      }
      return true;
    },
    {
      message: 'Principles must have unique ids (no duplicate id allowed).',
      path: ['principles'],
    },
  );

export type Principle = z.infer<typeof principleSchema>;
export type Principles = z.infer<typeof principlesSchema>;
