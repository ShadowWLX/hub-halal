/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/renderer/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'islamic': {
          'primary': '#1a472a',
          'accent': '#26d07c',
          'light': '#f0f9f5',
          'dark': '#0d1f15',
        },
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        'arabic': ['Noto Naskh Arabic', 'Amiri', 'Traditional Arabic', 'Arabic Typesetting', 'serif'],
      },
    },
  },
  plugins: [],
}
