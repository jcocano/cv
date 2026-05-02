import { z } from 'zod';

import { i18nString } from '@/lib/schemas/i18n-string';

export const LAB_PIECE_KEYS = ['kinetic', 'grid', 'marquee'] as const;
export const labPieceKeySchema = z.enum(LAB_PIECE_KEYS);
export type LabPieceKey = z.infer<typeof labPieceKeySchema>;

export const labPieceSchema = z
  .object({
    key: labPieceKeySchema,
    num: z.string().min(1),
    title: i18nString,
    description: i18nString,
    tags: z.array(z.string().min(1)).min(1),
    words: z.array(z.string().min(1)).min(1).optional(),
  })
  .strict()
  .refine(
    (piece) => {
      if (piece.key === 'kinetic') {
        return piece.words !== undefined;
      }
      return true;
    },
    {
      message: "The 'kinetic' piece requires a non-empty 'words' array.",
      path: ['words'],
    },
  );

export const labSchema = z
  .object({
    title: i18nString,
    lede: i18nString,
    pieces: z.array(labPieceSchema).length(3),
  })
  .strict()
  .refine(
    (lab) => {
      const seen = new Set<string>();
      for (const piece of lab.pieces) {
        if (seen.has(piece.key)) {
          return false;
        }
        seen.add(piece.key);
      }
      return true;
    },
    {
      message: 'Lab pieces must have unique keys (no duplicate key allowed).',
      path: ['pieces'],
    },
  );

export type LabPiece = z.infer<typeof labPieceSchema>;
export type Lab = z.infer<typeof labSchema>;
