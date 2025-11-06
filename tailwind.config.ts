import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#950606',
          dark: '#7a0505',
          light: '#b30808',
        },
        background: {
          DEFAULT: '#ffffff',
          dark: '#000000',
        },
        gray: {
          850: '#1a1a1a',
          950: '#0a0a0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        logo: ['var(--font-black-ops-one)', 'cursive'],
      },
      borderRadius: {
        DEFAULT: '12px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-metal': 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 50%, #1a1a1a 100%)',
      },
      boxShadow: {
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'red-glow': '0 0 20px rgba(149, 6, 6, 0.3), 0 0 40px rgba(149, 6, 6, 0.15)',
        'red-glow-lg': '0 0 30px rgba(149, 6, 6, 0.4), 0 0 60px rgba(149, 6, 6, 0.2)',
      },
    },
  },
  plugins: [],
}
export default config

