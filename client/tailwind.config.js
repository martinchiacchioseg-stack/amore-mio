/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff5f7',
          100: '#ffe6ed',
          200: '#fcccdb',
          300: '#f8a3be',
          400: '#f37198',
          500: '#e598ac', // Main Rose Pink
          600: '#c45a78', // Rose Gold Accent
          700: '#a33f5b',
          800: '#88374e',
          900: '#733245',
          dark: '#1a1a1a'
        }
      }
    },
  },
  plugins: [],
}
