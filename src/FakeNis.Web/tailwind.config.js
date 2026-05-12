/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Dated-corporate palette: heavy navy + steel grey, no rounded radius.
      colors: {
        nis: {
          navy: '#1F3A60',
          steel: '#3D5A80',
          line: '#C9D1DA',
          panel: '#EEF1F5',
        },
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
