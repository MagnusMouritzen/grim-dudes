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
        /** Aged bronze / temple metal — Warhammer Old World accent */
        verdigris: {
          DEFAULT: '#3d6b5b',
          400: '#4f8a75',
          500: '#3d6b5b',
          600: '#2f5245',
          700: '#1f3830',
          800: '#142620',
        },
        /** Cool masonry / Reikland stone */
        stone: {
          DEFAULT: '#5c5852',
          500: '#6e6a63',
          600: '#5c5852',
          700: '#45423d',
          800: '#2f2d29',
        },
        /** Warm brazier / torch highlight */
        brazier: {
          DEFAULT: '#c9782e',
          400: '#e08f45',
          500: '#c9782e',
          600: '#a55f22',
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
        card:
          '0 1px 0 0 rgba(184, 134, 11, 0.1) inset, 0 14px 36px -16px rgba(0,0,0,0.88), 0 0 0 1px rgba(0,0,0,0.35), 0 2px 0 0 rgba(0,0,0,0.28)',
        cardHover:
          '0 1px 0 0 rgba(224, 182, 74, 0.26) inset, 0 22px 44px -18px rgba(0,0,0,0.92), 0 0 0 1px rgba(184,134,11,0.22), 0 0 28px -12px rgba(61, 107, 91, 0.12)',
        innerParchment: 'inset 0 1px 0 0 rgba(232, 220, 196, 0.06)',
        gold: '0 0 0 1px rgba(184, 134, 11, 0.5), 0 0 28px -6px rgba(224, 182, 74, 0.38)',
        textGold: '0 1px 0 rgba(0,0,0,0.85), 0 0 24px rgba(184, 134, 11, 0.15)',
      },
      transitionTimingFunction: {
        grim: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '360ms',
        slower: '480ms',
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
        'grim-glow': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '0.95' },
        },
        'ember-drift': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '0.4' },
          '50%': { transform: 'translateY(-3px) scale(1.02)', opacity: '0.65' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '0.4' },
        },
      },
      animation: {
        'fade-in': 'fade-in 280ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        shimmer: 'shimmer-sweep 1.6s infinite',
        'spin-slow': 'spin-slow 1.2s linear infinite',
        'grim-glow': 'grim-glow 4.5s ease-in-out infinite',
        'ember-drift': 'ember-drift 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
