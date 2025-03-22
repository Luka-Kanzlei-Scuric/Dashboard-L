/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1D1D1F',
          light: '#3a3a3c',
        },
        secondary: {
          DEFAULT: '#06c',
          light: '#69a1ff',
        },
        neutral: {
          lightest: '#F5F5F7',
          light: '#E5E5E5',
          medium: '#86868B',
          dark: '#424245',
        }
      },
      fontFamily: {
        sans: [
          'SF Pro Display, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Open Sans, Helvetica Neue, sans-serif',
        ],
      },
    },
  },
  plugins: [],
}