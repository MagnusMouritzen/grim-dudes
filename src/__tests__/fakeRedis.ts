/**
 * Minimal in-memory fake of the subset of `@upstash/redis` that our code uses.
 * Shared across API and lib tests.
 */
type PipelineOp =
  | { kind: 'set'; key: string; value: string }
  | { kind: 'sadd'; key: string; member: string }
  | { kind: 'srem'; key: string; member: string }
  | { kind: 'del'; key: string };

export class FakeRedis {
  kv = new Map<string, string>();
  sets = new Map<string, Set<string>>();

  reset(): void {
    this.kv.clear();
    this.sets.clear();
  }

  async set(key: string, value: string): Promise<'OK'> {
    this.kv.set(key, value);
    return 'OK';
  }
  async get<T = string>(key: string): Promise<T | null> {
    return (this.kv.get(key) ?? null) as T | null;
  }
  async mget(...keys: string[]): Promise<(string | null)[]> {
    return keys.map((k) => this.kv.get(k) ?? null);
  }
  async exists(key: string): Promise<number> {
    return this.kv.has(key) ? 1 : 0;
  }
  async del(key: string): Promise<number> {
    return this.kv.delete(key) ? 1 : 0;
  }
  async smembers(key: string): Promise<string[]> {
    return Array.from(this.sets.get(key) ?? []);
  }
  async sadd(key: string, member: string): Promise<number> {
    const s = this.sets.get(key) ?? new Set<string>();
    const had = s.has(member);
    s.add(member);
    this.sets.set(key, s);
    return had ? 0 : 1;
  }
  async srem(key: string, member: string): Promise<number> {
    const s = this.sets.get(key);
    if (!s) return 0;
    const had = s.delete(member);
    return had ? 1 : 0;
  }
  async sscan(key: string): Promise<[string, string[]]> {
    const members = Array.from(this.sets.get(key) ?? []);
    return ['0', members];
  }

  pipeline() {
    return makePipeline(this);
  }
}

function makePipeline(instance: FakeRedis) {
    const ops: PipelineOp[] = [];
    const chain = {
      set(key: string, value: string) {
        ops.push({ kind: 'set', key, value });
        return chain;
      },
      sadd(key: string, member: string) {
        ops.push({ kind: 'sadd', key, member });
        return chain;
      },
      srem(key: string, member: string) {
        ops.push({ kind: 'srem', key, member });
        return chain;
      },
      del(key: string) {
        ops.push({ kind: 'del', key });
        return chain;
      },
      async exec(): Promise<Array<number | string | null>> {
        const results: Array<number | string | null> = [];
        for (const op of ops) {
          if (op.kind === 'set') {
            results.push(await instance.set(op.key, op.value));
          } else if (op.kind === 'sadd') {
            results.push(await instance.sadd(op.key, op.member));
          } else if (op.kind === 'srem') {
            results.push(await instance.srem(op.key, op.member));
          } else if (op.kind === 'del') {
            results.push(await instance.del(op.key));
          }
        }
        return results;
      },
    };
    return chain;
}

export const fakeRedis = new FakeRedis();
