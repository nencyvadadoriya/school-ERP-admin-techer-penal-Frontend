/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f0f9',
          100: '#cce1f2',
          200: '#99c2e6',
          300: '#66a4d9',
          400: '#3385cd',
          500: '#002B5B', // Primary blue
          600: '#002752',
          700: '#002044',
          800: '#001a37',
          900: '#001329',
        },
        secondary: {
          50: '#eaf0f7',
          100: '#d5e0ee',
          200: '#acc2dd',
          300: '#83a3cc',
          400: '#5a85bb',
          500: '#2D54A8', // Secondary blue
          600: '#294c97',
          700: '#213e7b',
          800: '#1a3162',
          900: '#14254a',
        }
      },
    },
  },
  plugins: [],
}
