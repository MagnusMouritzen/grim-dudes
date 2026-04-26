import { getPublicSiteBase } from './siteUrl';
import { loadEncounterLabel } from './viewEncounterLabel';
import { formatSceneTimeMdLine } from './viewSceneTimeSession';
import { formatScratchClipFooter, readScratchValues } from './viewScratchSnapshot';
import { loadRound } from './viewRoundSession';
import type { InitiativeRow } from './viewInitiativeSession';
import { sortInitiativeRows } from './viewInitiativeSession';

/** Same markdown as initiative “Copy MD” (links, **← turn**, label, scratch). Empty if no rows. */
export function buildInitiativeMarkdown(
  viewKey: string,
  rows: InitiativeRow[],
  activeKey: string | null
): string {
  if (rows.length === 0) return '';
  const round = loadRound(viewKey);
  const base = getPublicSiteBase();
  const sorted = sortInitiativeRows(rows);
  const lines = sorted.map((r, i) => {
    const init = r.initiative;
    const order = i + 1;
    const turn = r.key === activeKey ? ' **← turn**' : '';
    const st = r.state?.trim();
    const stPart = st ? ` — ${st.replace(/\]/g, '')}` : '';
    if (r.blockId) {
      const name = (r.name || r.blockId).replace(/]/g, '');
      return `${order}. [${name}](${base}/statblock/${encodeURIComponent(r.blockId)}) — Init ${init}${stPart}${turn}`;
    }
    return `${order}. ${r.name || '(unnamed)'} — Init ${init}${stPart}${turn}`;
  });
  const scratch = formatScratchClipFooter(readScratchValues(viewKey));
  const label = loadEncounterLabel(viewKey).trim();
  const timeMd = formatSceneTimeMdLine(viewKey);
  const timeBlock = timeMd ? `${timeMd}\n\n` : '';
  const title = label
    ? `## ${label}\n\n${timeBlock}## Initiative (round ${round})\n\n`
    : timeBlock
      ? `${timeBlock}## Initiative (round ${round})\n\n`
      : `## Initiative (round ${round})\n\n`;
  return title + lines.join('\n') + (scratch ? scratch.md : '');
}
