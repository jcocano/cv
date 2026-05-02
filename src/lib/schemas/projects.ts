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
  })
  .strict();

export type Project = z.infer<typeof projectSchema>;
