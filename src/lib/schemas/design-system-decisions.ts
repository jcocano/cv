import { z } from 'zod';

import { i18nString } from '@/lib/schemas/i18n-string';

export const designSystemDecisionSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/, 'kebab-case'),
    title: i18nString,
    rationale: i18nString,
    alternatives_rejected: i18nString.optional(),
    eyebrow: i18nString.optional(),
  })
  .strict();

export const designSystemDecisionsSchema = z
  .object({
    decisions: z.array(designSystemDecisionSchema).min(1),
  })
  .strict()
  .refine(
    (data) => {
      const seen = new Set<string>();
      for (const decision of data.decisions) {
        if (seen.has(decision.id)) {
          return false;
        }
        seen.add(decision.id);
      }
      return true;
    },
    {
      message: 'Design system decisions must have unique ids (no duplicate id allowed).',
      path: ['decisions'],
    },
  );

export type DesignSystemDecision = z.infer<typeof designSystemDecisionSchema>;
export type DesignSystemDecisions = z.infer<typeof designSystemDecisionsSchema>;
