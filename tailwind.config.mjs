/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0a0a0a',
          subtle: '#3a3a3a',
          muted: '#737373',
          faint: '#a3a3a3',
        },
        paper: {
          DEFAULT: '#fafaf7',
          subtle: '#f4f4ee',
          line: '#e5e5dd',
        },
        signal: {
          DEFAULT: '#c2410c',
          soft: '#fff7ed',
        },
      },
      fontFamily: {
        serif: [
          'ui-serif',
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'Times',
          'serif',
        ],
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          '"SF Mono"',
          '"Cascadia Code"',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace',
        ],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      maxWidth: {
        'reading': '38rem',
        'page': '64rem',
      },
      letterSpacing: {
        'tightest': '-0.04em',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2.5s ease-in-out infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
    },
  },
  plugins: [],
};
