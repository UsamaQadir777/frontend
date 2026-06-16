/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.js", "./src/**/*.{js,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        sage: {
          50: "#F3F8EF",
          100: "#E4F0DB",
          200: "#CFE4C3",
          300: "#ADD29F",
          500: "#5EA45F",
          600: "#438A48",
          700: "#2F6F39",
          900: "#173822"
        },
        leaf: {
          50: "#EEF8EE",
          100: "#D9EFD8",
          500: "#46A756",
          600: "#358946",
          700: "#276C38"
        },
        mint: {
          100: "#DBF7E6",
          200: "#B8EDCF",
          400: "#74D99A"
        },
        clay: {
          50: "#FFFDF7",
          100: "#F8F2E6",
          200: "#EFE4D2"
        },
        cream: "#FFF8EA",
        ink: "#17251D",
        cocoa: "#62564A",
        coral: "#F28F7C",
        amber: "#F4B942",
        sky: "#7DB7D9",
        rose: "#EE8FA5"
      },
      boxShadow: {
        clay: "8px 12px 24px rgba(76, 101, 76, 0.16)"
      }
    }
  },
  plugins: []
};
