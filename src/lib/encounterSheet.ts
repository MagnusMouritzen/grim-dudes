import { computeEffectiveStats } from '@/lib/statblockDerived';
import type { Statblock, TraitRef } from '@/lib/types';

/** First line of text for a compact encounter row (print sheet / one-liner). */
export function encounterSummaryLine(block: Statblock | null | undefined): string {
  if (!block) return '—';
  const p = block.playerNotes;
  if (typeof p === 'string' && p.trim()) {
    const line = p.trim().split(/\r?\n/)[0];
    if (line) return line;
  }
  const traits = block.traits;
  if (Array.isArray(traits) && traits.length) {
    const t = traits[0];
    if (typeof t === 'string' && t.trim()) return t.trim();
    if (t && typeof t === 'object' && 'name' in t && typeof (t as { name: string }).name === 'string') {
      return (t as { name: string }).name;
    }
  }
  return '—';
}

/** Plain text for pasting into chat, notes, or VTT — not a full stat block. */
export function buildEncounterPlainText(args: {
  title: string;
  blocks: Statblock[];
  traitsRef: TraitRef[];
  viewUrl: string;
}): string {
  const title = args.title.trim() || 'Encounter';
  const lines = args.blocks.map((block) => {
    const id = String(block.id ?? '');
    const name = block.name || id || '?';
    const { effectiveWounds, effectiveMovement } = computeEffectiveStats(block, args.traitsRef);
    const note = encounterSummaryLine(block);
    return `• ${name} — Wounds ${effectiveWounds}, Move ${effectiveMovement} — ${note}`;
  });
  return `${title}\n\n${lines.join('\n')}\n\nView: ${args.viewUrl}`.trim();
}

/** One creature, same shape as a line in buildEncounterPlainText — for chat / VTT snippets. */
export function buildStatblockPlainText(
  block: Statblock,
  traitsRef: TraitRef[],
  viewUrl: string
): string {
  const name = block.name || String(block.id ?? '') || '?';
  const { effectiveWounds, effectiveMovement } = computeEffectiveStats(block, traitsRef);
  const note = encounterSummaryLine(block);
  return `${name}\nWounds ${effectiveWounds}, Move ${effectiveMovement}\n${note}\n\nView: ${viewUrl}`.trim();
}
