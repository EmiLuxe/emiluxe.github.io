/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0a0a0b',
          elevated: '#121214',
          card: '#1a1a1e',
          hover: '#222228',
        },
        accent: {
          DEFAULT: '#e50914',
          hover: '#f40612',
          muted: '#b20710',
          glow: 'rgba(229, 9, 20, 0.4)',
        },
        gold: {
          DEFAULT: '#f5c518',
          muted: '#c9a012',
        },
        muted: {
          DEFAULT: '#8b8b95',
          foreground: '#a1a1ab',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          strong: 'rgba(255, 255, 255, 0.15)',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Bebas Neue"', 'system-ui', 'sans-serif'],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        30: '7.5rem',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        glow: '0 0 40px rgba(229, 9, 20, 0.25)',
        card: '0 8px 32px rgba(0, 0, 0, 0.5)',
        cinematic: '0 25px 80px rgba(0, 0, 0, 0.8)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-overlay':
          'linear-gradient(to top, #0a0a0b 0%, transparent 40%, rgba(10,10,11,0.6) 100%)',
        'hero-side':
          'linear-gradient(to right, #0a0a0b 0%, transparent 50%, rgba(10,10,11,0.4) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      screens: {
        xs: '475px',
        '3xl': '1920px',
      },
      maxWidth: {
        content: '1440px',
        wide: '1680px',
      },
      zIndex: {
        nav: '50',
        sidebar: '40',
        overlay: '30',
        modal: '60',
      },
    },
  },
  plugins: [],
};
