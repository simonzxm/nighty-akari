/** @type {import('tailwindcss').Config} */
export default {
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#000000',
          panel: '#0d0d0f',
          tile: '#16161a',
          'tile-hover': '#212127',
          border: '#27272f',
          wall: '#08080a',
          'wall-border': '#1d1d24',
        },
        light: {
          glow: '#fff7cc',
          tile: '#fff9db',
          border: '#ffe066',
          bulb: '#ffcc00',
          beam: '#fffbe6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      }
    },
  },
  plugins: [],
}
