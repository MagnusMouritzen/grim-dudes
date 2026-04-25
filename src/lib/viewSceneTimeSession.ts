const PREFIX = 'grim-dudes:scene-time:';

const IDS = ['dawn', 'day', 'dusk', 'night', 'late'] as const;

export type SceneTimeId = (typeof IDS)[number] | '';

const LABEL: Record<Exclude<SceneTimeId, ''>, string> = {
  dawn: 'Dawn',
  day: 'Day',
  dusk: 'Dusk',
  night: 'Night',
  late: 'Very late',
};

function normalize(raw: string | null): SceneTimeId {
  if (raw == null || raw === '') return '';
  const s = String(raw).trim().toLowerCase();
  if ((IDS as readonly string[]).includes(s)) return s as SceneTimeId;
  return '';
}

/**
 * “What time is it in the fiction” for this tab—scratch only, for pacing and copy/export.
 */
export function loadSceneTime(viewKey: string): SceneTimeId {
  if (typeof window === 'undefined') return '';
  try {
    return normalize(sessionStorage.getItem(`${PREFIX}${viewKey}`));
  } catch {
    return '';
  }
}

export function saveSceneTime(viewKey: string, value: SceneTimeId): void {
  if (typeof window === 'undefined') return;
  try {
    const v = normalize(value);
    if (v === '') {
      sessionStorage.removeItem(`${PREFIX}${viewKey}`);
    } else {
      sessionStorage.setItem(`${PREFIX}${viewKey}`, v);
    }
  } catch {
    // ignore
  }
}

export function sceneTimeDisplayLabel(id: SceneTimeId): string {
  if (id === '') return '';
  return LABEL[id] ?? '';
}

export function formatSceneTimePlainLine(viewKey: string): string {
  const id = loadSceneTime(viewKey);
  if (id === '') return '';
  return `Time: ${sceneTimeDisplayLabel(id)}`;
}

export function formatSceneTimeMdLine(viewKey: string): string {
  const id = loadSceneTime(viewKey);
  if (id === '') return '';
  return `*Time: ${sceneTimeDisplayLabel(id)}*`;
}
