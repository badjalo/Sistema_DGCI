/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['attribute', 'data-theme'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      colors: {
        primary: '#3b6ff5',
      },
      borderRadius: {
        xl:  '0.875rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        'soft':  '0 2px 8px rgba(0,0,0,0.06)',
        'card':  '0 4px 16px rgba(0,0,0,0.08)',
        'modal': '0 20px 48px rgba(0,0,0,0.16)',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        modalIn: {
          from: { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
      },
      animation: {
        'fade-up':       'fadeUp 0.3s ease-out forwards',
        'modal-in':      'modalIn 0.25s cubic-bezier(0.16,1,0.3,1) forwards',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
