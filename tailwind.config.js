/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        'weather-primary': '#00668A',
        'weather-secondary': '#004E71',
      },
      fontFamily: {
        'weather': ['-apple-system', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}