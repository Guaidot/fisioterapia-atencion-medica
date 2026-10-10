/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff8ff',
          100: '#dbeefe',
          200: '#bfe1fe',
          300: '#93cdfd',
          400: '#60b0fa',
          500: '#3b92f6',
          600: '#2574eb',
          700: '#1d5ed8',
          800: '#1e4daf',
          900: '#1e438a',
        },
      },
    },
  },
  plugins: [],
};
