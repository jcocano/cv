import { z } from 'zod';

import { i18nString } from '@/lib/schemas/i18n-string';

export const ossProjectSchema = z
  .object({
    org: z.string().min(1),
    repo: z.string().min(1),
    license: z.string().min(1),
    url: z.url(),
    description: i18nString,
    languages: z
      .array(
        z
          .object({
            label: z.string().min(1),
            swatch: z.string(),
          })
          .strict(),
      )
      .min(1),
    order: z.number().int(),
  })
  .strict();

export type OssProject = z.infer<typeof ossProjectSchema>;
