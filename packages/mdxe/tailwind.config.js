/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './mdx-components.js',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    '@tailwindcss/typography',
  ],
}
