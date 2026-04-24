import { z } from 'zod';
import { statblockBodySchema } from './validateStatblock';

/**
 * Client-facing parse schemas. These are intentionally lenient:
 * unexpected keys (new fields added server-side) are allowed, so the UI
 * does not break on forward-compatible API changes.
 */

const statblockReadSchema = statblockBodySchema.passthrough();

export const statblockArraySchema = z.array(statblockReadSchema);

export const statblockPaginatedSchema = z.object({
  items: statblockArraySchema,
  nextCursor: z.string(),
});

export const skillRefSchema = z
  .object({
    name: z.string(),
    characteristic: z.string().optional(),
    description: z.string().optional(),
  })
  .passthrough();

export const traitRefSchema = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    generic: z.boolean().optional(),
    input: z.union([z.boolean(), z.string()]).optional(),
    effects: z
      .object({
        characteristics: z.record(z.string(), z.number()).optional(),
        movement: z.number().optional(),
        wounds: z.object({ addBonus: z.string().optional() }).passthrough().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const weaponsRefSchema = z
  .object({
    qualitiesAndFlaws: z.array(z.object({ name: z.string() }).passthrough()).optional(),
    melee: z.object({ categories: z.array(z.any()).optional() }).passthrough().optional(),
    ranged: z.object({ categories: z.array(z.any()).optional() }).passthrough().optional(),
    ammunition: z.object({ categories: z.array(z.any()).optional() }).passthrough().optional(),
  })
  .passthrough();

export const armourRefSchema = z
  .object({
    qualitiesAndFlaws: z.array(z.object({ name: z.string() }).passthrough()).optional(),
    armour: z.object({ categories: z.array(z.any()).optional() }).passthrough().optional(),
  })
  .passthrough();

export const careersRefSchema = z
  .object({
    classes: z.array(z.any()).optional(),
  })
  .passthrough();

export const templateSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
  })
  .passthrough();

export const templatesArraySchema = z.array(templateSchema);

export const sharePackSchema = z.object({
  id: z.string(),
  ids: z.array(z.string()),
});

/** Safely parse `fetch().then(r => r.json())` output, returning null on failure. */
export function safeParse<T>(schema: { safeParse: (v: unknown) => { success: boolean; data?: T } }, value: unknown): T | null {
  const res = schema.safeParse(value);
  return res.success ? (res.data as T) : null;
}
