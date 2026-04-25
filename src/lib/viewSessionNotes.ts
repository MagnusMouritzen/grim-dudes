const PREFIX = 'grim-dudes:session-notes:';

export function loadSessionNotes(key: string): string {
  if (typeof window === 'undefined') return '';
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${key}`);
    return typeof raw === 'string' ? raw : '';
  } catch {
    return '';
  }
}

export function saveSessionNotes(key: string, text: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`${PREFIX}${key}`, text);
  } catch {
    // quota / private mode
  }
}
