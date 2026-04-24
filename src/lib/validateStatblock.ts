import { z } from 'zod';

const charKeyEnum = z.enum(['WS', 'BS', 'S', 'T', 'I', 'Ag', 'Dex', 'Int', 'WP', 'Fel']);

const characteristicValueSchema = z.union([
  z.number().finite(),
  z.object({
    base: z.number().finite(),
    advances: z.number().finite().optional(),
    addition: z.number().finite().optional(),
  }),
]);

const skillSchema = z.object({
  name: z.string().min(1).max(200),
  advances: z.number().finite(),
});

const traitSchema = z.union([
  z.string().min(1).max(200),
  z.object({
    name: z.string().min(1).max(200),
    inputValue: z.string().max(500).optional(),
  }),
]);

const careerSchema = z.object({
  className: z.string().max(200).optional(),
  careerName: z.string().max(200).optional(),
  class: z.string().max(200).optional(),
  career: z.string().max(200).optional(),
  level: z.number().int().min(1).max(4).optional(),
});

const weaponPickSchema = z.object({
  category: z.string().max(200),
  name: z.string().max(200),
  ammunition: z.string().max(200).optional(),
});

const armourPickSchema = z.object({
  category: z.string().max(200),
  name: z.string().max(200),
});

export const statblockBodySchema = z
  .object({
    id: z.string().max(200).optional(),
    name: z.string().max(500).optional(),
    templateId: z.string().max(200).optional(),
    randomiseCharacteristics: z.boolean().optional(),
    characteristics: z.record(charKeyEnum, characteristicValueSchema).optional(),
    size: z.string().max(50).optional(),
    wounds: z.number().finite().nonnegative().optional(),
    movement: z.number().finite().optional(),
    skills: z.array(skillSchema).max(300).optional(),
    talents: z.array(z.string().max(200)).max(200).optional(),
    traits: z.array(traitSchema).max(200).optional(),
    tags: z.array(z.string().min(1).max(80)).max(50).optional(),
    careers: z.array(careerSchema).max(20).optional(),
    weapons: z
      .union([
        z.string().max(5000),
        z.object({
          melee: z.array(weaponPickSchema).max(50).optional(),
          ranged: z.array(weaponPickSchema).max(50).optional(),
        }),
      ])
      .optional(),
    armour: z.union([z.array(armourPickSchema).max(30), z.string().max(2000)]).optional(),
  })
  .strict();

export type StatblockPayload = z.infer<typeof statblockBodySchema>;

export function validateStatblockPayload(body: unknown): { ok: true; data: StatblockPayload } | { ok: false; error: string } {
  const parsed = statblockBodySchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((e) => `${e.path.join('.') || 'root'}: ${e.message}`).join('; ');
    return { ok: false, error: msg || 'Invalid stat block payload' };
  }
  return { ok: true, data: parsed.data };
}
