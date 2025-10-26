/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"], // scan all your files
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"], // custom font
      },
      colors: {
        tektonGradientStart: "#ff5733",
        tektonGradientMid: "#c74e39",
        tektonGradientEnd: "#e03a3c",
      },
    },
  },
  plugins: [],
};
