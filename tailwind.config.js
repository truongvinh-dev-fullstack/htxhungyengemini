/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["selector", '[zaui-theme="dark"]'],
  content: ["./src/**/*.{js,jsx,ts,tsx,vue}", "./index.html"],
  theme: {
    extend: {
      colors: {
        agri: {
          50: "#f2fbf4",
          100: "#e1f7e7",
          200: "#c4eed0",
          500: "#2e7d32",
          600: "#256c29",
          700: "#1b5e20",
          800: "#144a18",
          900: "#0d3511",
        },
        zalo: {
          DEFAULT: "#0068ff",
          dark: "#0053cc",
          light: "#e7f0ff",
        },
        gold: {
          500: "#f59e0b",
          600: "#d97706",
        }
      },
      fontSize: {
        'elderly-sm': ['16px', '24px'],
        'elderly-base': ['18px', '26px'],
        'elderly-lg': ['20px', '28px'],
        'elderly-xl': ['24px', '32px'],
        'elderly-2xl': ['28px', '36px'],
      },
    },
  },
  plugins: [],
};
