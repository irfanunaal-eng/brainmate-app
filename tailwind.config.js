/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FF6B6B", // Eğlenceli Mercan Kırmızısı
        secondary: "#4ECDC4", // Enerjik Turkuaz
        tertiary: "#FFE66D", // Neşeli Sarı
        background: "#F4F7F6", // Yumuşak, ferah arka plan
        surface: "#FFFFFF",
        text: "#2D3142", // Koyu lacivert/gri metin
      }
    },
  },
  plugins: [],
}
