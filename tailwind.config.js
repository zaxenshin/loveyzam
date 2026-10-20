/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Her Theme (Icy Powder Blue #CAF0F8)
        her: {
          blue: '#CAF0F8',
          blueHeader: '#BEE9E8',
          blueBg: '#F4FCFE',
          blueText: '#0F4C5C',
        },
        // Your Theme (Burgundy & Coffee)
        your: {
          burgundy: '#812D45',
          burgundyHeader: '#6A2337',
          coffee: '#6B463C',
          caramel: '#D6A16C',
          dark: '#272426',
        },
        // Shared Theme (Soft Pink)
        shared: {
          pink: '#F5DCE7',
          pinkHeader: '#F4C2D7',
          pinkText: '#5C233B',
        },
        cream: '#FFF8F1',
      },
      fontFamily: {
        mono: ['"VT323"', 'monospace'],
        pixel: ['"Press Start 2P"', 'cursive'],
        sans: ['"Quicksand"', 'sans-serif'],
      },
      boxShadow: {
        'retro': '4px 4px 0px 0px rgba(39, 36, 38, 0.9)',
        'retro-sm': '2px 2px 0px 0px rgba(39, 36, 38, 0.9)',
        'retro-lg': '6px 6px 0px 0px rgba(39, 36, 38, 0.9)',
      }
    },
  },
  plugins: [],
}