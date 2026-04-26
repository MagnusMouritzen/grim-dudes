import { describe, expect, it } from 'vitest';
import { safeRedirectPath } from './session';

describe('safeRedirectPath', () => {
  it('allows simple relative paths', () => {
    expect(safeRedirectPath('/admin')).toBe('/admin');
    expect(safeRedirectPath('/statblock/x/edit')).toBe('/statblock/x/edit');
  });

  it('rejects protocol-relative and non-relative URLs', () => {
    expect(safeRedirectPath('//evil.com')).toBe('/');
    expect(safeRedirectPath('https://evil.com')).toBe('/');
    expect(safeRedirectPath('')).toBe('/');
  });

  it('uses fallback when missing', () => {
    expect(safeRedirectPath(null, '/admin')).toBe('/admin');
    expect(safeRedirectPath(undefined)).toBe('/');
  });
});
