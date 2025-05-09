/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Keep the old color system for compatibility with existing components
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
        },
        // Add zinc color palette for the new design
        zinc: {
          900: '#18181B',
          800: '#27272A',
          700: '#3F3F46',
          600: '#52525B',
          500: '#71717A',
          400: '#A1A1AA',
          300: '#D4D4D8',
          200: '#E4E4E7',
          100: '#F4F4F5',
          50: '#FAFAFA',
        },
        gray: {
          900: '#1A1A1A',
          800: '#2D2D2D',
          700: '#4A4A4A',
          600: '#6B6B6B',
          500: '#8C8C8C',
          400: '#ADADAD',
          300: '#D1D1D1',
          200: '#E5E5E5',
          100: '#F2F2F2',
          50: '#F9F9F9',
        }
      },
      fontFamily: {
        sans: [
          'SF Pro Display, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Open Sans, Helvetica Neue, sans-serif',
        ],
      },
      animation: {
        'fadeIn': 'fadeIn 0.4s ease-out forwards',
        'scaleIn': 'scaleIn 0.2s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    },
  },
  plugins: [],
}