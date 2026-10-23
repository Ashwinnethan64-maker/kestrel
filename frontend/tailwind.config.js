/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        deck: {
          deep: '#050b14',
          surface: '#0a1322',
          panel: '#0f1d33',
          border: 'rgba(255, 255, 255, 0.08)',
          glow: 'rgba(6, 182, 212, 0.25)'
        },
        intel: {
          cyan: '#06b6d4',
          cyanGlow: '#22d3ee'
        },
        tactical: {
          critical: '#ef4444',
          warning: '#f59e0b',
          resolved: '#10b981',
          purple: '#8b5cf6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
