/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // Adjust based on your file structure
    "./**/*.html" // Include HTML files if you have any
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}