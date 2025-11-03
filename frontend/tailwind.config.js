/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#ffffff',
        panel: '#f8f9fa',
        muted: '#6b7280',
        text: '#1f2937',
        accent: '#ff6b35',
        accent2: '#ff8c42',
        blue: '#0f149a',
        danger: '#ef4444',
        border: '#e5e7eb',
      },
      backgroundImage: {
        'gradient-main': 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        'gradient-accent': 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)',
        'gradient-blue': 'linear-gradient(135deg, #0f149a 0%, #1a20b0 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'accent': '0 4px 14px 0 rgba(255, 107, 53, 0.25)',
        'accent-lg': '0 10px 30px -5px rgba(255, 107, 53, 0.3)',
        'blue': '0 4px 14px 0 rgba(15, 20, 154, 0.15)',
      },
    },
  },
  plugins: [],
}

