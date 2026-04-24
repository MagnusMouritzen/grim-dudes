import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { requireWriteAuth, writeAuthRequired } from './writeAuth';

const origToken = process.env.WRITE_TOKEN;
beforeEach(() => {
  delete process.env.WRITE_TOKEN;
});
afterEach(() => {
  if (origToken == null) delete process.env.WRITE_TOKEN;
  else process.env.WRITE_TOKEN = origToken;
});

function req(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/statblocks', {
    method: 'POST',
    headers,
  });
}

describe('writeAuth', () => {
  it('allows when WRITE_TOKEN is unset (dev default)', () => {
    expect(writeAuthRequired()).toBe(false);
    expect(requireWriteAuth(req())).toBeNull();
  });

  it('rejects when token is required and missing', async () => {
    process.env.WRITE_TOKEN = 'secret';
    const res = requireWriteAuth(req());
    expect(res).not.toBeNull();
    expect(res?.status).toBe(401);
  });

  it('accepts Authorization: Bearer <token>', () => {
    process.env.WRITE_TOKEN = 'secret';
    expect(requireWriteAuth(req({ authorization: 'Bearer secret' }))).toBeNull();
  });

  it('accepts x-write-token header', () => {
    process.env.WRITE_TOKEN = 'secret';
    expect(requireWriteAuth(req({ 'x-write-token': 'secret' }))).toBeNull();
  });

  it('accepts grim_write_token cookie', () => {
    process.env.WRITE_TOKEN = 'secret';
    expect(
      requireWriteAuth(req({ cookie: 'foo=bar; grim_write_token=secret; baz=qux' }))
    ).toBeNull();
  });

  it('rejects wrong token', () => {
    process.env.WRITE_TOKEN = 'secret';
    const res = requireWriteAuth(req({ 'x-write-token': 'wrong' }));
    expect(res?.status).toBe(401);
  });
});
