/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        // ── Tactical Midnight Deck Tokens (DESIGN.md § 5.1) ──────────────────
        deck: {
          deep:    '#050b14',   // Deepest tactical void — main background
          surface: '#0a1322',   // Control surface — topbar, panels
          panel:   '#0f1d33',   // Glassmorphic card panels
          elevated:'#162640',   // Elevated interactive elements
          border:  'rgba(255,255,255,0.08)',
          glow:    'rgba(6,182,212,0.25)',
        },

        // ── Tactical Status & Alert Colors ────────────────────────────────────
        intel: {
          cyan:    '#06b6d4',   // AI insights, network links, selection rings
          crimson: '#ef4444',   // Critical / violent FIRs, high-risk suspects
          amber:   '#f59e0b',   // Moderate risk, pending investigation
          emerald: '#10b981',   // Closed cases, arrested co-accused
          purple:  '#8b5cf6',   // Digital evidence, cyber crimes
        },

        // ── Typography tokens ─────────────────────────────────────────────────
        tx: {
          primary:   '#f8fafc',
          secondary: '#94a3b8',
          muted:     '#64748b',
          cyan:      '#22d3ee',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      animation: {
        "fade-in":     "fadeIn 0.2s ease-out",
        "slide-down":  "slideDown 0.18s ease-out",
        "pulse-slow":  "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "beacon-ping": "beaconPing 1.8s ease-in-out infinite",
        "status-blink":"statusBlink 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        beaconPing: {
          "0%, 100%": { opacity: "1",   transform: "scale(1)" },
          "50%":      { opacity: "0.4", transform: "scale(1.6)" },
        },
        statusBlink: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.5" },
        },
      },
      boxShadow: {
        'deck-glow':   '0 0 15px rgba(6, 182, 212, 0.15)',
        'deck-glow-lg':'0 0 30px rgba(6, 182, 212, 0.2)',
        'crimson-glow':'0 0 15px rgba(239, 68, 68, 0.2)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
