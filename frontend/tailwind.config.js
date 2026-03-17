/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mystic: {
          50:  '#f5f0ff',
          100: '#ede0ff',
          200: '#d9bfff',
          300: '#bf94ff',
          400: '#a066ff',
          500: '#8040ff',
          600: '#6b1fff',
          700: '#5a0de8',
          800: '#4a0fbf',
          900: '#3d0f99',
          950: '#260a6b',
        },
        oracle: {
          gold:   '#d4af6c',
          amber:  '#c8962a',
          cream:  '#e8dcc8',
          shadow: '#0a0814',
          deep:   '#0f0c1c',
          mid:    '#1a1530',
          glow:   '#7b5ea7',
        },
      },
      fontFamily: {
        serif:    ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:     ['"Raleway"', 'system-ui', 'sans-serif'],
        mystical: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      animation: {
        'float':       'float 6s ease-in-out infinite',
        'glow-pulse':  'glowPulse 3s ease-in-out infinite',
        'card-reveal': 'cardReveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'shimmer':     'shimmer 2s linear infinite',
        'star-drift':  'starDrift 20s linear infinite',
        'fade-in':     'fadeIn 0.5s ease-out forwards',
        'slide-up':    'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6', filter: 'blur(8px)' },
          '50%':      { opacity: '1',   filter: 'blur(12px)' },
        },
        cardReveal: {
          '0%':   { opacity: '0', transform: 'scale(0.8) rotateY(90deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotateY(0deg)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        starDrift: {
          '0%':   { transform: 'translateY(0) rotate(0deg)' },
          '100%': { transform: 'translateY(-100vh) rotate(360deg)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'oracle-gradient': 'radial-gradient(ellipse at top, #2a1f4a 0%, #0d0a1a 70%)',
        'card-gradient':   'linear-gradient(135deg, #2a1f4a 0%, #1a1030 50%, #0d0a1a 100%)',
        'gold-shimmer':    'linear-gradient(90deg, transparent 0%, #d4af37 50%, transparent 100%)',
        'glow-radial':     'radial-gradient(circle, rgba(160,102,255,0.3) 0%, transparent 70%)',
      },
      boxShadow: {
        'oracle':     '0 0 40px rgba(160,102,255,0.3), 0 0 80px rgba(160,102,255,0.1)',
        'card':       '0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(160,102,255,0.2)',
        'gold':       '0 0 20px rgba(212,175,55,0.5), 0 0 40px rgba(212,175,55,0.2)',
        'inner-glow': 'inset 0 0 30px rgba(160,102,255,0.1)',
      },
    },
  },
  plugins: [],
}
