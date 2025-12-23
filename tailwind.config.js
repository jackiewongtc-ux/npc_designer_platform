/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'var(--color-border)', // gray-200
        input: 'var(--color-input)', // gray-200
        ring: 'var(--color-ring)', // blue-600
        background: 'var(--color-background)', // gray-50
        foreground: 'var(--color-foreground)', // gray-900
        primary: {
          DEFAULT: 'var(--color-primary)', // gray-800
          foreground: 'var(--color-primary-foreground)', // white
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)', // gray-600
          foreground: 'var(--color-secondary-foreground)', // white
        },
        accent: {
          DEFAULT: 'var(--color-accent)', // blue-600
          foreground: 'var(--color-accent-foreground)', // white
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)', // red-600
          foreground: 'var(--color-destructive-foreground)', // white
        },
        muted: {
          DEFAULT: 'var(--color-muted)', // gray-200
          foreground: 'var(--color-muted-foreground)', // gray-500
        },
        card: {
          DEFAULT: 'var(--color-card)', // white
          foreground: 'var(--color-card-foreground)', // gray-900
        },
        popover: {
          DEFAULT: 'var(--color-popover)', // white
          foreground: 'var(--color-popover-foreground)', // gray-900
        },
        success: {
          DEFAULT: 'var(--color-success)', // green-600
          foreground: 'var(--color-success-foreground)', // white
        },
        warning: {
          DEFAULT: 'var(--color-warning)', // yellow-600
          foreground: 'var(--color-warning-foreground)', // gray-900
        },
        error: {
          DEFAULT: 'var(--color-error)', // red-600
          foreground: 'var(--color-error-foreground)', // white
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)'],
        caption: ['var(--font-caption)'],
        data: ['var(--font-data)'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'modal': '0 10px 25px rgba(0, 0, 0, 0.15)',
      },
      transitionDuration: {
        'micro': '200ms',
        'state': '300ms',
      },
      transitionTimingFunction: {
        'micro': 'ease-out',
        'state': 'ease-in-out',
      },
      spacing: {
        'header': 'var(--header-height)',
        'unit': 'var(--spacing-unit)',
      },
      zIndex: {
        'nav': '1000',
        'dropdown': '1100',
        'mobile-menu': '1200',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}