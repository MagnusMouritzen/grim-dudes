import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Grim Dudes - WFRP 4e Stat Block Editor';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0f0c07',
          backgroundImage:
            'radial-gradient(ellipse 100% 70% at 50% -10%, rgba(184,134,11,0.18), transparent 60%), radial-gradient(ellipse 80% 60% at 50% 110%, rgba(139,0,0,0.2), transparent 70%)',
          color: '#e8dcc4',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 18,
              letterSpacing: 8,
              textTransform: 'uppercase',
              color: '#b8860b',
            }}
          >
            Warhammer Fantasy Roleplay 4e
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 128,
              fontWeight: 700,
              color: '#d1a33a',
              letterSpacing: 2,
              lineHeight: 1,
            }}
          >
            Grim Dudes
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              color: 'rgba(232,220,196,0.85)',
            }}
          >
            Stat block editor for the Old World
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 28,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 18,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: 'rgba(232,220,196,0.45)',
            }}
          >
            For the Old World
          </div>
        </div>
      </div>
    ),
    size
  );
}
