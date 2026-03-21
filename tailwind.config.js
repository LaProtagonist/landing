/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: {
          900: '#05070e',
          800: '#0b1020',
        },
        aurora: {
          300: '#8ef4ff',
          400: '#6ad1ff',
          500: '#4ea4ff',
        },
        glass: 'rgba(16, 24, 44, 0.6)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 60px rgba(106, 209, 255, 0.18)',
      },
    },
  },
  plugins: [],
}
