/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        background: 'var(--color-background)',
        text: 'var(--color-text)',
        'primary-dark': 'var(--color-primary-dark)',
      },
      fontFamily: {
        primary: ['var(--font-primary)', 'sans-serif'],
        secondary: ['var(--font-secondary)', 'sans-serif'],
      }
    },
  },
  plugins: [],
}; 