import { z } from 'zod';

export const themeTokensSchema = z
  .object({
    bg: z.string(),
    'bg-elev': z.string(),
    'bg-elev-2': z.string(),
    fg: z.string(),
    'fg-dim': z.string(),
    'fg-mute': z.string(),
    line: z.string(),
    'line-soft': z.string(),
    accent: z.string(),
    'accent-dim': z.string(),
    warn: z.string(),
  })
  .strict();

export const tokensSchema = z
  .object({
    dark: themeTokensSchema,
    light: themeTokensSchema,
    paper: themeTokensSchema,
  })
  .strict();

export type ThemeTokens = z.infer<typeof themeTokensSchema>;
export type Tokens = z.infer<typeof tokensSchema>;
