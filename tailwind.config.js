/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E8F0FE',
          100: '#D2E3FC',
          200: '#AECBFA',
          300: '#8AB4F8',
          400: '#669DF6',
          500: '#1A73E8',
          600: '#1765CC',
          700: '#1256B0',
          800: '#0D47A1',
          900: '#0A3A85',
        },
        success: {
          50: '#E6F4EA',
          500: '#34A853',
          700: '#1E7E34',
        },
        danger: {
          50: '#FCE8E6',
          500: '#D93025',
          700: '#B3261E',
        },
        warning: {
          50: '#FEF7E0',
          500: '#FBBC04',
          700: '#E37400',
        },
        surface: '#FFFFFF',
        background: '#F8F9FA',
        ink: '#1C2333',
        muted: '#667085',
        line: '#E4E7EC',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
