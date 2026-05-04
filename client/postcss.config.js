// ─── postcss.config.js ────────────────────────────────────────────────────────
// PostCSS transforms CSS using plugins.
// Vite runs PostCSS automatically on every CSS file as part of its build process.
//
// Typically, we don't need to edit this file; it just wires up the two
// plugins Tailwind CSS requires:
// ──────────────────────────────────────────────────────────────────────────────

export default {
  plugins: {
    // tailwindcss: Processes CSS and injects all the Tailwind utility
    // classes used in .vue / .html / .js files.
    tailwindcss: {},

    // autoprefixer: Automatically adds browser vendor prefixes to CSS
    // (e.g. -webkit-transform, -moz-...) so styles work across all
    // major browsers without us having to write them manually.
    autoprefixer: {},
  },
}
