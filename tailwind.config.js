/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        surface: {
          page:   'rgb(var(--surface-page) / <alpha-value>)',
          card:   'rgb(var(--surface-card) / <alpha-value>)',
          raised: 'rgb(var(--surface-raised) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--border) / <alpha-value>)',
          subtle:  'rgb(var(--border-subtle) / <alpha-value>)',
        },
        ink: {
          primary:   'rgb(var(--ink-primary) / <alpha-value>)',
          secondary: 'rgb(var(--ink-secondary) / <alpha-value>)',
          muted:     'rgb(var(--ink-muted) / <alpha-value>)',
        },
        accent: {
          DEFAULT:  'rgb(var(--accent) / <alpha-value>)',
          hover:    'rgb(var(--accent-hover) / <alpha-value>)',
          contrast: 'rgb(var(--accent-contrast) / <alpha-value>)',
        },
        gain: 'rgb(var(--gain) / <alpha-value>)',
        loss: 'rgb(var(--loss) / <alpha-value>)',

        // Fixed palette for the public landing page. It is deliberately
        // theme-independent (the marketing page never follows the toggle),
        // so it must NOT be built from the --token vars above.
        marketing: {
          ground: '#0A0E10',
          panel:  '#12181B',
          raised: '#171F22',
          line:   '#1F282B',
          ink:    '#EDF1F1',
          soft:   '#9FADB1',
          faint:  '#6E7B7F',
          teal:   '#4FB0A5',
          deep:   '#2C6F68',
          amber:  '#D8A657',
        },
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        // Landing page display face only — a wide institutional grotesque.
        display: ['Archivo', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':  'fadeIn 0.4s ease-out forwards',
        'fade-out': 'fadeOut 0.6s ease-in forwards',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeOut: {
          '0%':   { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
};

