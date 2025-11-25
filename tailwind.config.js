/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'hubspot-orange': {
          DEFAULT: '#FF7A59',
          hover: '#FF6A45',
          light: '#FFF4F1',
        },
        'hubspot-blue': {
          DEFAULT: '#0091AE',
          hover: '#007A93',
          light: '#E6F7FA',
        },
      },
      boxShadow: {
        'hubspot': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'hubspot-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'hubspot-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ["light"],
    styled: false, // Reduce DaisyUI's aggressive styling
  },
}
