import { ImageResponse } from 'next/og';
import { getStatblockById } from '@/lib/statblockRedis';
import { computeEffectiveStats } from '@/lib/statblockDerived';
import { slugifyStatblockId } from '@/lib/statblockKeys';
import type { Statblock } from '@/lib/types';

export const runtime = 'nodejs';
export const alt = 'Grim Dudes stat block';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const CHAR_ORDER = ['WS', 'BS', 'S', 'T', 'I', 'Ag', 'Dex', 'Int', 'WP', 'Fel'] as const;

export default async function Og({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let block: Statblock | null = null;
  try {
    const rec = await getStatblockById(slugifyStatblockId(id));
    block = (rec as unknown as Statblock) ?? null;
  } catch {
    block = null;
  }

  const name = block?.name || 'Unknown';
  const { effectiveCh, effectiveWounds, effectiveMovement } = block
    ? computeEffectiveStats(block, [])
    : { effectiveCh: {}, effectiveWounds: 0, effectiveMovement: 0 };

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f0c07',
          backgroundImage:
            'radial-gradient(ellipse 120% 80% at 50% -10%, rgba(184,134,11,0.15), transparent 60%)',
          color: '#e8dcc4',
          fontFamily: 'Georgia, serif',
          padding: 56,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid rgba(184,134,11,0.5)',
            paddingBottom: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: '#b8860b',
              fontSize: 16,
            }}
          >
            Grim Dudes - WFRP 4e
          </div>
          <div
            style={{
              display: 'flex',
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: 'rgba(232,220,196,0.6)',
              fontSize: 14,
            }}
          >
            {block?.size || '—'}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 92,
            color: '#d1a33a',
            marginTop: 30,
            marginBottom: 20,
            letterSpacing: 2,
            lineHeight: 1,
          }}
        >
          {name}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gap: 10,
            marginTop: 20,
          }}
        >
          {CHAR_ORDER.map((k) => (
            <div
              key={k}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '10px 6px',
                backgroundColor: 'rgba(15,12,7,0.9)',
                border: '1px solid rgba(61,61,61,0.6)',
                borderRadius: 6,
              }}
            >
              <div style={{ display: 'flex', fontSize: 16, color: '#8b0000' }}>{k}</div>
              <div style={{ display: 'flex', fontSize: 32, color: '#e8dcc4' }}>
                {String((effectiveCh as Record<string, number | undefined>)[k] ?? '—')}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 40,
            marginTop: 40,
            fontSize: 22,
            color: 'rgba(232,220,196,0.85)',
          }}
        >
          <div style={{ display: 'flex', gap: 10 }}>
            <span style={{ color: '#b8860b' }}>Wounds</span>
            <span>{effectiveWounds}</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <span style={{ color: '#b8860b' }}>Movement</span>
            <span>{effectiveMovement}</span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
