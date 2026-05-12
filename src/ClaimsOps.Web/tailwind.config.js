/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Newer corporate palette — cool blue accent, soft borders, whitespace.
      colors: {
        co: {
          slate: '#0F2940',
          blue: '#2563EB',
          surface: '#F7F9FC',
          line: '#E2E8F0',
        },
      },
      fontFamily: { sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
