/** @type {import('tailwindcss').Config} */
// Palette, type and radii mapped to the In.Plan (SCP) design system:
// Open Sans, brand purple #9000ff on a #f5f6f8 canvas, tight 4/8px radii, flat.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F5F6F8', // In.Plan canvas
          sunken: '#EAEAEA',
        },
        line: {
          DEFAULT: '#EAEAEA',
          strong: '#DFDFE0',
        },
        ink: {
          900: '#1F1F20',
          700: '#444647',
          500: '#949598',
          400: '#ADB0B4',
          300: '#BFBFC1',
        },
        brand: {
          50: '#FAF3FF',
          100: '#F4E3FF',
          200: '#EACDFF',
          300: '#D899FF',
          400: '#C46CFF',
          500: '#9000FF', // In.Plan primary purple
          600: '#6F00CE', // hover
          700: '#4F0096', // active
        },
        state: {
          idle: '#949598',
          working: '#9000FF',
          blocked: '#FF9A3B',
          starved: '#0D56E2',
          bottleneck: '#EE4444',
        },
        accent: {
          DEFAULT: '#EE4444',
          soft: '#FEE2E2',
        },
      },
      fontFamily: {
        sans: ['Open Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['Open Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        label: '0.14em',
      },
      boxShadow: {
        // In.Plan is nearly flat — cards read via borders, not elevation.
        card: '0 1px 2px rgba(31, 31, 32, 0.06)',
        lift: '0 4px 15px rgba(0, 0, 0, 0.15)',
        inset: 'inset 0 1px 2px rgba(31, 31, 32, 0.05)',
      },
      borderRadius: {
        // Card radius 8px, control radius 4px per the In.Plan token set.
        md: '4px',
        lg: '6px',
        xl: '8px',
        '2xl': '8px',
        '3xl': '10px',
        xl2: '8px',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
