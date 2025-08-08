module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0C3B68",
        background: '#f7faff',
        secondary: "#FF7A00"
      },
      corePlugins: {
        preflight: false, // Önemli!
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
        nunito: ['Nunito', 'sans-serif'],
        qanelas: ['"Qanelas"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}