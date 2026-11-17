function loadContainerQueries() {
  try {
    return require('@tailwindcss/container-queries')
  } catch {
    // Fallback for a Vite process that started before `npm install`
    // and still has a stale package-name resolution failure.
    return require('./node_modules/@tailwindcss/container-queries/dist/index.js')
  }
}

/** @type {import('tailwindcss').Config} */
module.exports = {
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
  plugins: [loadContainerQueries()],
}
