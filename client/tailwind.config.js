/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          accent: { DEFAULT: '#c6ff3d', hover: '#b2e82c' },
          ink: {
            950: '#0b0c0e',
            900: '#111317',
            850: '#161a20',
            800: '#1b2027',
            700: '#262c35',
            600: '#3a424f',
            500: '#5a6470',
            400: '#8a93a0',
            300: '#b8bfc9',
          },
        },
        fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      },
    },
    plugins: [],
  };