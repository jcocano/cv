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
    order: z.number().int().min(1).max(3).optional(),
    eyebrow: i18nString,
    stack: z.array(z.string().min(1)).min(1),
  })
  .strict()
  .superRefine((project, ctx) => {
    const slugSuffix = project.slug ? ` (slug: "${project.slug}")` : '';
    if (project.featured && project.order === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['order'],
        message: `featured projects must declare an 'order' in [1, 3]${slugSuffix}`,
      });
    }
    if (!project.featured && project.order !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['order'],
        message: `non-featured projects must not declare an 'order'${slugSuffix}`,
      });
    }
  });

export type Project = z.infer<typeof projectSchema>;
