/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        osu: {
          pink: '#ff66aa',
          blue: '#0066cc',
          purple: '#8866ee',
          dark: '#1a1a1a',
          gray: '#2a2a2a'
        }
      },
      fontFamily: {
        'display': ['Space Grotesk', 'Noto Sans KR', 'sans-serif'],
        'korean': ['Noto Sans KR', 'sans-serif'],
        'mono': ['IBM Plex Mono', 'ui-monospace', 'monospace']
      }
    },
  },
  plugins: [],
}
