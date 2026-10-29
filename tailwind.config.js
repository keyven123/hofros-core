import containerQueries from '@tailwindcss/container-queries'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    containers: {
      sm: '30rem',
      md: '42rem',
      lg: '56rem',
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
          soft: '#dbeafe',
        },
      },
    },
  },
  plugins: [containerQueries],
}

