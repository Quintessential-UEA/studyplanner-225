// ─── tailwind.config.js ────────────────────────────────────────────────────────
// Tailwind scans source files for class names and generates only the CSS for
// those classes. Custom semantic colour tokens here mirror the CSS variables
// defined in main.css, so components can use utility classes like `bg-card`
// or `text-body` instead of hardcoded colour values.
// ──────────────────────────────────────────────────────────────────────────────

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts}',
  ],

  // Dark mode is toggled by adding/removing the `dark` class on <html>.
  // The theme store (stores/theme.js) manages this.
  darkMode: 'class',

  theme: {
    extend: {
      fontFamily: {
        sans: ['"JetBrains Mono"', 'sans-serif', 'monospace'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        // ── Surfaces ──────────────────────────────────────────────────────
        canvas:  'var(--color-canvas)',    // page background
        card:    'var(--color-card)',      // card / panel background
        pop:     'var(--color-pop)',       // hover / elevated background

        // ── Text ──────────────────────────────────────────────────────────
        body:    'var(--color-body)',      // primary text
        dim:     'var(--color-dim)',       // secondary / supporting text
        ghost:   'var(--color-ghost)',     // placeholder / subtle text

        // ── Borders ───────────────────────────────────────────────────────
        edge:    'var(--color-edge)',      // default border
        rim:     'var(--color-rim)',       // stronger border

        // ── Brand primary ─────────────────────────────────────────────────
        primary:          'var(--color-primary)',
        'primary-soft':   'var(--color-primary-soft)',
        'primary-text':   'var(--color-primary-text)',
        'primary-border': 'var(--color-primary-border)',

        // ── Per-module accent (injected at runtime by theme store) ─────────
        accent:          'var(--color-accent)',
        'accent-soft':   'var(--color-accent-soft)',
        'accent-text':   'var(--color-accent-text)',
        'accent-border': 'var(--color-accent-border)',

        // ── Status: success ───────────────────────────────────────────────
        ok:          'var(--color-ok)',
        'ok-soft':   'var(--color-ok-soft)',
        'ok-text':   'var(--color-ok-text)',
        'ok-border': 'var(--color-ok-border)',

        // ── Status: warning ───────────────────────────────────────────────
        warn:          'var(--color-warn)',
        'warn-soft':   'var(--color-warn-soft)',
        'warn-text':   'var(--color-warn-text)',
        'warn-border': 'var(--color-warn-border)',

        // ── Status: danger ────────────────────────────────────────────────
        danger:          'var(--color-danger)',
        'danger-soft':   'var(--color-danger-soft)',
        'danger-text':   'var(--color-danger-text)',
        'danger-border': 'var(--color-danger-border)',

        // ── Status: info ──────────────────────────────────────────────────
        info:          'var(--color-info)',
        'info-soft':   'var(--color-info-soft)',
        'info-text':   'var(--color-info-text)',
        'info-border': 'var(--color-info-border)',
      },
    },
  },

  plugins: [],
}
