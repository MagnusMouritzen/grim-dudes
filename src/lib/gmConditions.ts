import conditionsData from '@/data/gm/conditions.json';

export type GmCondition = {
  id: string;
  name: string;
  /** Original summary — not a substitute for the official condition text. */
  hint: string;
};

const list = conditionsData as GmCondition[];

export function getGmConditions(): GmCondition[] {
  return list;
}

export function searchGmConditions(query: string): GmCondition[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.hint.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
  );
}
