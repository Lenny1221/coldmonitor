/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#00c8ff',
        'brand-dark': '#00a8dd',
        navy: '#0D1B2E',
      },
      fontFamily: {
        display: ['"Exo 2"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
