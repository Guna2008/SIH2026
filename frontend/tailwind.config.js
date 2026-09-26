/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#17251D',
          soft: '#748078',
        },
        paper: {
          DEFAULT: '#F5FAF6',
          raised: '#FFFFFF',
          sunken: '#E8F5EC',
        },
        brand: {
          50: '#E8F5EC',
          100: '#D4EBDD',
          200: '#B6DCC2',
          300: '#8BC9A0',
          400: '#4FB475',
          500: '#16834A',
          600: '#16834A',
          700: '#126F3F',
          800: '#0C5231',
          900: '#093C26',
        },
        gold: {
          50: '#FFF6E7',
          100: '#F9E6BF',
          200: '#F0C979',
          300: '#E3AA3D',
          400: '#D98D19',
          500: '#B87314',
          600: '#8E590E',
        },
        clay: {
          50: '#FCEDED',
          100: '#F2CCCC',
          300: '#DC8585',
          400: '#C34F4F',
          500: '#A63D3D',
        },
        line: '#DCE8DF',
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 rgba(27,36,29,0.06), 0 1px 2px rgba(27,36,29,0.04)',
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '10px',
      },
    },
  },
  plugins: [],
}
