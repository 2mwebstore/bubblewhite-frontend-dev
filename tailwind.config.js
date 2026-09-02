/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/components/**/*.{vue,js}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/app.vue',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAF8F5',
        'cream-dark': '#F2EEE8',
        ink: '#121110',
        charcoal: '#232019',
        rust: '#B9794F',
        gold: '#F0A93C',
        muted: '#8B8378',
        line: '#E9E4D9',
      },
      fontFamily: {
        sans: ['Kantumruy Pro', 'Manrope', 'sans-serif'],
        body: ['Kantumruy Pro', 'sans-serif'],
      },
      borderRadius: {
        card: '10px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
