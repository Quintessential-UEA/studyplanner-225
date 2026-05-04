// ─── tailwind.config.js ───────────────────────────────────────────────────────
// This is the configuration file for Tailwind CSS.
//
// Tailwind works by scanning your source files for class names (e.g.
// "text-center", "p-4", "bg-blue-500"), then generating ONLY the CSS
// rules for those classes. This keeps the final CSS bundle very small.
//
// The 'content' setting tells Tailwind where to look for class names.
// ──────────────────────────────────────────────────────────────────────────────

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // Scan all .vue, .js, and .html files inside the src/ folder.
    // The "**" means "any subfolder, any depth".
    './index.html',
    './src/**/*.{vue,js,ts}',
  ],

  theme: {
    extend: {
      // Custom design tokens can be defined here. For example:
      //   colors: { primary: '#4f46e5' }
      // This lets you use 'bg-primary' or 'text-primary' in your templates.
    },
  },

  plugins: [
    // Official Tailwind plugins can be added here, maybe:
    //   require('@tailwindcss/forms')    — better default form styling
    //   require('@tailwindcss/typography') — pretty prose/article styling
  ],
}
