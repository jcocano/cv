import { z } from 'zod';

import { i18nString } from '@/lib/schemas/i18n-string';

export const projectSchema = z
  .object({
    slug: z.string().min(1),
    title: i18nString,
    company: z.string().min(1),
    year: z.number().int(),
    featured: z.boolean(),
    tagline: i18nString,
    description: i18nString,
    cover: z.string().min(1),
    tags: z.array(z.string()),
    order: z.number().int(),
    eyebrow: i18nString,
    stack: z.array(z.string().min(1)).min(1),
  })
  .strict();

export type Project = z.infer<typeof projectSchema>;
