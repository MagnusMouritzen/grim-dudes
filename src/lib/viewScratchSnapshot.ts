import { loadAdvantage } from './viewAdvantageSession';
import { loadFortune } from './viewFortuneSession';
import { loadSessionXp } from './viewXpSession';
import { loadTension } from './viewTensionSession';

export type ScratchValues = {
  fortune: number;
  sessionXp: number;
  tension: number;
  advantage: number;
};

export function readScratchValues(viewKey: string): ScratchValues {
  return {
    fortune: loadFortune(viewKey),
    sessionXp: loadSessionXp(viewKey),
    tension: loadTension(viewKey),
    advantage: loadAdvantage(viewKey),
  };
}

/**
 * When any scratch value is &gt; 0, returns footer strings for pasting; otherwise null.
 */
export function formatScratchClipFooter(v: ScratchValues): { plain: string; md: string } | null {
  const parts: string[] = [];
  if (v.fortune > 0) parts.push(`Fortune ${v.fortune}`);
  if (v.sessionXp > 0) parts.push(`Session XP ${v.sessionXp}`);
  if (v.tension > 0) parts.push(`Tension ${v.tension}/8`);
  if (v.advantage > 0) parts.push(`Advantage ${v.advantage}`);
  if (parts.length === 0) return null;
  const one = parts.join(' · ');
  return {
    plain: `\n\n---\nTable (scratch) · ${one}`,
    md: `\n\n---\n*Table (scratch):* ${one}`,
  };
}
