import { z } from 'zod';

import { i18nString } from '@/lib/schemas/i18n-string';

export const ICON_KEYS = ['assistedDev', 'ragCitation', 'multiProvider', 'agentsMcp'] as const;
export const iconKeySchema = z.enum(ICON_KEYS);
export type IconKey = z.infer<typeof iconKeySchema>;

const aiReadyCard = z
  .object({
    iconKey: iconKeySchema,
    title: i18nString,
    body: i18nString,
    tags: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const aiReadySchema = z
  .object({
    title: i18nString,
    lede: i18nString,
    cards: z.array(aiReadyCard).length(4),
    myTake: i18nString,
  })
  .strict();

export type AiReady = z.infer<typeof aiReadySchema>;
export type AiReadyCard = z.infer<typeof aiReadyCard>;
