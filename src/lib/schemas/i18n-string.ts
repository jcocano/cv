import { z } from 'zod';

export const i18nString = z
  .object({
    es: z.string(),
    en: z.string(),
  })
  .strict();

export const i18nStringArray = z
  .object({
    es: z.array(z.string()),
    en: z.array(z.string()),
  })
  .strict();

export type I18nString = z.infer<typeof i18nString>;
export type I18nStringArray = z.infer<typeof i18nStringArray>;
