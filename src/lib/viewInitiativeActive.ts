const PREFIX = 'grim-dudes:initiative-active:';

export function loadInitiativeActiveKey(viewKey: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${viewKey}`);
    if (raw == null || raw === '' || raw === 'null') return null;
    return raw;
  } catch {
    return null;
  }
}

export function saveInitiativeActiveKey(viewKey: string, key: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (key == null || key === '') {
      sessionStorage.removeItem(`${PREFIX}${viewKey}`);
    } else {
      sessionStorage.setItem(`${PREFIX}${viewKey}`, key);
    }
  } catch {
    // ignore
  }
}
