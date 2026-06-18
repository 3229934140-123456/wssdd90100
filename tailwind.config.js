/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        surface: {
          DEFAULT: '#1A1D23',
          50: '#2A2D35',
          100: '#22252B',
          200: '#1A1D23',
          300: '#12141A',
        },
        accent: {
          DEFAULT: '#F97316',
          light: '#FB923C',
          dark: '#EA580C',
        },
        info: '#3B82F6',
        cat: {
          abuse: '#EF4444',
          boycott: '#8B5CF6',
          quality: '#EAB308',
          fake_ad: '#F97316',
          price: '#3B82F6',
        },
      },
      fontFamily: {
        display: ['"DM Sans"', 'sans-serif'],
        body: ['"Noto Sans SC"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
