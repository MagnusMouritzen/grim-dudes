import { buildInitiativeMarkdown } from './buildInitiativeMarkdown';
import { buildInitiativePlainText } from './buildInitiativePlainText';
import { loadCombatLog } from './viewCombatLog';
import { loadInitiativeActiveKey } from './viewInitiativeActive';
import { loadInitiativeSession } from './viewInitiativeSession';
import { loadSessionNotes } from './viewSessionNotes';
import { formatSceneTimeMdLine, formatSceneTimePlainLine } from './viewSceneTimeSession';

/**
 * One plain-text block for “everything on this /view or stat page tab”: initiative (if any), session notes, combat log.
 * Sections only appear if they have content.
 */
export function buildViewSessionBundlePlain(viewKey: string): string {
  const parts: string[] = [];
  const rows = loadInitiativeSession(viewKey);
  const active = loadInitiativeActiveKey(viewKey);
  const init = buildInitiativePlainText(viewKey, rows, active);
  if (init) {
    parts.push(init);
  } else {
    const timeP = formatSceneTimePlainLine(viewKey);
    if (timeP) parts.push(timeP);
  }

  const notes = loadSessionNotes(viewKey).trim();
  if (notes) {
    parts.push('---\n\nSESSION NOTES\n\n' + notes);
  }

  const log = loadCombatLog(viewKey).trim();
  if (log) {
    parts.push('---\n\nCOMBAT & SCENE LOG\n\n' + log);
  }

  return parts.join('\n\n');
}

/**
 * Same sections as {@link buildViewSessionBundlePlain}, with markdown headings and stat block links in initiative.
 */
export function buildViewSessionBundleMarkdown(viewKey: string): string {
  const parts: string[] = [];
  const rows = loadInitiativeSession(viewKey);
  const active = loadInitiativeActiveKey(viewKey);
  const init = buildInitiativeMarkdown(viewKey, rows, active);
  if (init) {
    parts.push(init);
  } else {
    const timeM = formatSceneTimeMdLine(viewKey);
    if (timeM) parts.push(timeM);
  }

  const notes = loadSessionNotes(viewKey).trim();
  if (notes) {
    parts.push('---\n\n## Session notes\n\n' + notes);
  }

  const log = loadCombatLog(viewKey).trim();
  if (log) {
    parts.push('---\n\n## Combat & scene log\n\n' + log);
  }

  return parts.join('\n\n');
}
