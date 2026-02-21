/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void:    '#050810',
        deep:    '#080C18',
        surface: '#0A0F1E',
        panel:   '#0D1222',
        border:  '#1A2040',
        orange:  '#FF6B1A',
        'orange-light': '#FF8C42',
        'orange-dim':   '#CC5514',
        blue:    '#1E6FFF',
        'blue-light':   '#5B8FFF',
        success: '#10B981',
        danger:  '#EF4444',
        warn:    '#F59E0B',
        muted:   '#3A4060',
        sub:     '#8892B0',
        text:    '#E8EAF0',
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
        body:    ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}