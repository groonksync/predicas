/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', 'Inter', 'Helvetica Neue', 'sans-serif'],
      },
      boxShadow: {
        'apple': '0 2px 10px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'apple-card': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      },
      colors: {
        appleGray: {
          50: '#FBFBFD',
          100: '#F5F5F7',
          200: '#E8E8ED',
          300: '#D2D2D7',
          400: '#86868B',
          500: '#6E6E73',
          800: '#1D1D1F',
          900: '#161617',
        }
      }
    },
  },
  plugins: [],
}
