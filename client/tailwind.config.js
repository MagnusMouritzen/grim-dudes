/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Crimson Text', 'Georgia', 'serif'],
      },
      colors: {
        parchment: '#e8dcc4',
        ink: '#1a1510',
        blood: '#8b0000',
        iron: '#3d3d3d',
        gold: '#b8860b',
      },
    },
  },
  plugins: [],
};
