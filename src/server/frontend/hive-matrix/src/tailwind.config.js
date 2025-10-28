/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
};


/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brick:  { DEFAULT: "#e26128" }, // headings
        hive:   { DEFAULT: "#9fe2d5" }, // sub-headings
        graph:  { DEFAULT: "#725c4e" }, // supporting text/lines
        text:   { DEFAULT: "#000000" }, // body text
        surface:{ DEFAULT: "#ffffff" }, // cards/background
      },
      fontFamily: {
        heading: ['"PT Sans"', "system-ui", "sans-serif"],
        body: ['"PT Sans Narrow"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,.05), 0 8px 24px rgba(0,0,0,.06)",
      },
      borderRadius: { xl2: "1rem" },
    },
  },
  plugins: [],
};
