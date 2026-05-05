import { z } from 'zod';

export const siteStatusSchema = z
  .object({
    build_sha: z.string().regex(/^[a-f0-9]{7,40}$/),
    build_time: z.iso.datetime(),
    schema_version: z.string().regex(/^\d+\.\d+\.\d+$/),
    page_weight_kb: z.number().nonnegative(),
    js_payload_kb: z.number().nonnegative(),
    css_payload_kb: z.number().nonnegative(),
    routes_count: z.number().int().nonnegative(),
  })
  .strict();

export type SiteStatus = z.infer<typeof siteStatusSchema>;
