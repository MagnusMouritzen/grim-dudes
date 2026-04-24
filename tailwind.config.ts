import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', './app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Cinzel', 'serif'],
        body: ['var(--font-body)', 'Crimson Text', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        parchment: {
          DEFAULT: '#e8dcc4',
          50: '#faf5ea',
          100: '#f1e8d2',
          200: '#e8dcc4',
          300: '#d9c9a9',
          400: '#b7a27e',
        },
        ink: {
          DEFAULT: '#1a1510',
          700: '#221c16',
          800: '#151108',
          900: '#0f0c07',
          950: '#0a0805',
        },
        blood: {
          DEFAULT: '#8b0000',
          400: '#a11818',
          500: '#8b0000',
          600: '#6d0000',
          700: '#540000',
          800: '#3a0000',
          900: '#260000',
        },
        iron: {
          DEFAULT: '#3d3d3d',
          500: '#4a4a47',
          600: '#3d3d3d',
          700: '#2b2a27',
          800: '#1f1e1c',
        },
        gold: {
          DEFAULT: '#b8860b',
          300: '#e0b64a',
          400: '#d1a33a',
          500: '#b8860b',
          600: '#956d09',
          700: '#6f5207',
        },
      },
      fontSize: {
        eyebrow: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.14em' }],
        'display-md': ['1.875rem', { lineHeight: '1.1', letterSpacing: '0.02em' }],
        'display-lg': ['2.5rem', { lineHeight: '1.05', letterSpacing: '0.01em' }],
        'display-xl': ['3.25rem', { lineHeight: '1', letterSpacing: '0.01em' }],
      },
      borderRadius: {
        card: '0.625rem',
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(184, 134, 11, 0.08) inset, 0 12px 32px -18px rgba(0,0,0,0.8), 0 2px 0 0 rgba(0,0,0,0.3)',
        cardHover:
          '0 1px 0 0 rgba(224, 182, 74, 0.22) inset, 0 18px 40px -18px rgba(0,0,0,0.9), 0 0 0 1px rgba(184,134,11,0.18)',
        innerParchment: 'inset 0 1px 0 0 rgba(232, 220, 196, 0.05)',
        gold: '0 0 0 1px rgba(184, 134, 11, 0.45), 0 0 24px -6px rgba(224, 182, 74, 0.35)',
      },
      transitionTimingFunction: {
        grim: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '360ms',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'shimmer-sweep': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 240ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        shimmer: 'shimmer-sweep 1.6s infinite',
        'spin-slow': 'spin-slow 1.2s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
