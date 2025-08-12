module.exports = {
  content: ['./components/**/*.tsx', './pages/**/*.tsx'],
  darkMode: 'class', // manual toggle control
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'olive': {
          800: '#262C26',
          900: '#1F231F',
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
