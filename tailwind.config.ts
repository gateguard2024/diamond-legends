import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0E1A2B',
        panel: '#15243A',
        raised: '#1B2D47',
        line: '#2A3F5E',
        chalk: '#EEF2F7',
        muted: '#9FB0C7',
        amber: { DEFAULT: '#F4B23E', soft: '#FFD27A' },
        teal: '#4FC3B8',
        solo: '#8DA2FF',
        warn: '#F07B3F',
        elite: '#FF8FA3',
      },
      fontFamily: {
        display: ['Oswald', 'Impact', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        pop: { '0%': { transform: 'scale(.85)', opacity: '0' }, '60%': { transform: 'scale(1.04)', opacity: '1' }, '100%': { transform: 'scale(1)' } },
      },
      animation: { pop: 'pop 300ms ease-out' },
    },
  },
  plugins: [],
};

export default config;
