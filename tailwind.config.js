module.exports = {
  purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    container: {
      center: true,
    },
    extend: {
      backgroundColor: {
        'dark-mode': '#121212',
      },
      textColor: {
        'dark-mode': '#f5f5f5',
      },
      linkColor: {
        'dark-mode': '#bb86fc',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
