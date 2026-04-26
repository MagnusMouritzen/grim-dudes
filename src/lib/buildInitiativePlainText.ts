import { loadEncounterLabel } from './viewEncounterLabel';
import { formatSceneTimePlainLine } from './viewSceneTimeSession';
import { formatScratchClipFooter, readScratchValues } from './viewScratchSnapshot';
import { loadRound } from './viewRoundSession';
import type { InitiativeRow } from './viewInitiativeSession';
import { sortInitiativeRows } from './viewInitiativeSession';

/** Same plain text as initiative “Copy list” (incl. label, scratch). Empty string if `rows` is empty. */
export function buildInitiativePlainText(
  viewKey: string,
  rows: InitiativeRow[],
  activeKey: string | null
): string {
  if (rows.length === 0) return '';
  const round = loadRound(viewKey);
  const sorted = sortInitiativeRows(rows);
  const lines = sorted.map((r, i) => {
    const mark = r.key === activeKey ? ' ← turn' : '';
    const st = r.state?.trim();
    return `${i + 1}. ${r.name || '(unnamed)'} — Init ${r.initiative}${
      st ? ` — ${st}` : ''
    }${mark}`;
  });
  const label = loadEncounterLabel(viewKey).trim();
  const timeLine = formatSceneTimePlainLine(viewKey);
  const timeBlock = timeLine ? `${timeLine}\n\n` : '';
  const head = (label ? `${label}\n\n` : '') + timeBlock + `Round ${round}\n\nInitiative\n`;
  const scratch = formatScratchClipFooter(readScratchValues(viewKey));
  return head + lines.join('\n') + (scratch ? scratch.plain : '');
}
