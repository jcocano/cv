import { z } from 'zod';

import { i18nString } from '@/lib/schemas/i18n-string';

const emailLink = z.string().refine(
  (value) => {
    const withoutScheme = value.startsWith('mailto:') ? value.slice('mailto:'.length) : value;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(withoutScheme);
  },
  { message: 'Invalid email (must be a raw address or mailto: URL).' },
);

const heroLinks = z
  .object({
    email: emailLink,
    github: z.url(),
    linkedin: z.url(),
  })
  .strict();

export const heroSchema = z
  .object({
    name: z.string().min(1),
    role: i18nString,
    pitch: i18nString,
    location: i18nString,
    status: i18nString,
    roleShort: z.string().min(1),
    aiTopics: i18nString,
    links: heroLinks,
  })
  .strict();

export type Hero = z.infer<typeof heroSchema>;
export type HeroLinks = z.infer<typeof heroLinks>;
