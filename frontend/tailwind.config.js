/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        frost: {
          50:  '#e8f4ff',
          100: '#d0e9ff',
          200: '#a0d0ff',
          400: '#00c8ff',
          500: '#0096ff',
          600: '#0080ff',
          700: '#0060cc',
          800: '#0d1b2e',
          900: '#0a1520',
          950: '#080e1a',
        },
      },
      fontFamily: {
        exo: ['"Exo 2"', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
