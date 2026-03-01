/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          dark: '#1e40af',
        },
      },
      boxShadow: {
        soft: '0 2px 6px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};
