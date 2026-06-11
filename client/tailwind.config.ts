import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0F2B46',
        accent: '#1A6B8A',
        background: '#F8FAFC',
        surface: '#FFFFFF',
        border: '#E2E8F0',
        'text-secondary': '#64748B',
        'text-muted': '#94A3B8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        button: '0.5rem',
        card: '0.75rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.06)',
      },
      maxWidth: {
        '8xl': '88rem',
      },
    },
  },
  plugins: [],
};

export default config;

// ✓ tailwind.config.ts complete
