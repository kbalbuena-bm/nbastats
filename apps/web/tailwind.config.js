/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  // Tell Tailwind which files to scan for CSS classes
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#13ec80',
        'market-red': '#fa5538',
        'market-green': '#13ec80',
        'background-light': '#f6f8f7',
        'background-dark': '#102219',
        'card-dark': '#162e22',
        'border-dark': '#234836',
        'text-muted': '#92c9ad',
      },
      fontFamily: {
        'display': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

