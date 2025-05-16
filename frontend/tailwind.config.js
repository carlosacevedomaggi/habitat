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
        
        'theme-background-primary': 'var(--color-background-primary)',
        'theme-background-secondary': 'var(--color-background-secondary)',
        'theme-header-background': 'var(--color-header-background)',
        'theme-header-text': 'var(--color-header-text)',
        'theme-footer-background': 'var(--color-footer-background)',
        'theme-footer-text': 'var(--color-footer-text)',
        'theme-border': 'var(--color-border)',
        'theme-success': 'var(--color-success)',
        'theme-error': 'var(--color-error)',
        'theme-info': 'var(--color-info)',
        'theme-warning': 'var(--color-warning)',
        'theme-text-primary-lightbg': 'var(--color-text-primary-lightbg)',
        'theme-text-secondary-lightbg': 'var(--color-text-secondary-lightbg)',
      },
      fontFamily: {
        primary: ['var(--font-primary)', 'sans-serif'],
        secondary: ['var(--font-secondary)', 'sans-serif'],
      }
    },
  },
  plugins: [],
}; 