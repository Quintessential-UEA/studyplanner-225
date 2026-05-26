// ─── src/stores/theme.js ──────────────────────────────────────────────────────
// Theme engine. Manages:
//   • Dark / light mode (persisted to localStorage + respects OS preference)
//   • Per-module accent colour palette (generated from a single hex value,
//     WCAG 4.5:1 contrast, injected into CSS custom properties so
//     any component can reference --color-accent-* or the Tailwind utils
//     accent / accent-soft / accent-text / accent-border).
// ──────────────────────────────────────────────────────────────────────────────

import { defineStore } from 'pinia'
import { ref } from 'vue'

// ─── Colour maths helpers ──────────────────────────────────────────────────────

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  }
}

function rgbToHsl({ r, g, b }) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h, s, l }
}

function hslToHex(h, s, l) {
  const a = s * Math.min(l, 1 - l)
  const f = n => {
    const k = (n + h * 12) % 12
    const val = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * Math.max(0, Math.min(1, val))).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

// Relative luminance per WCAG 2.1
function luminance({ r, g, b }) {
  const lin = c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrastRatio(hexA, hexB) {
  const L1 = luminance(hexToRgb(hexA))
  const L2 = luminance(hexToRgb(hexB))
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Calc a four-value palette from a single accent hex.
 * Returns { base, soft, text, border } where:
 *   base   - the original hex (stored verbatim)
 *   soft   - very light (light mode) or very dark (dark mode) tinted bg
 *   text   - readable text colour that achieves >= 4.5:1 on `soft`
 *   border - medium tint for borders / rings
 */
export function generatePalette(hex, isDark) {
  const { h, s } = rgbToHsl(hexToRgb(hex))

  if (isDark) {
    const soft = hslToHex(h, Math.min(s * 0.55, 0.35), 0.13)
    const border = hslToHex(h, Math.min(s * 0.50, 0.40), 0.27)
    let textL = 0.60
    let textHex = hslToHex(h, Math.min(s * 1.1, 0.90), textL)
    while (contrastRatio(textHex, soft) < 4.5 && textL < 0.95) {
      textL += 0.02
      textHex = hslToHex(h, Math.min(s * 1.1, 0.90), textL)
    }
    return { base: hex, soft, text: textHex, border }
  } else {
    const soft = hslToHex(h, Math.min(s * 0.22, 0.18), 0.96)
    const border = hslToHex(h, Math.min(s * 0.32, 0.28), 0.83)
    let textL = 0.36
    let textHex = hslToHex(h, Math.min(s, 0.75), textL)
    while (contrastRatio(textHex, soft) < 4.5 && textL > 0.05) {
      textL -= 0.02
      textHex = hslToHex(h, Math.min(s, 0.75), textL)
    }
    return { base: hex, soft, text: textHex, border }
  }
}

// ─── CSS var injection ────────────────────────────────────────────────────────

function setAccentVars(palette) {
  const el = document.documentElement
  el.style.setProperty('--color-accent', palette.base)
  el.style.setProperty('--color-accent-soft', palette.soft)
  el.style.setProperty('--color-accent-text', palette.text)
  el.style.setProperty('--color-accent-border', palette.border)
}

function clearAccentVars() {
  const el = document.documentElement
  el.style.removeProperty('--color-accent')
  el.style.removeProperty('--color-accent-soft')
  el.style.removeProperty('--color-accent-text')
  el.style.removeProperty('--color-accent-border')
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useThemeStore = defineStore('theme', () => {
  const stored = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = ref(stored === 'dark' || (!stored && prefersDark))

  const accentHex = ref(null)

  function _apply(dark) {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
    // Regene the accent palette for the new mode
    if (accentHex.value) {
      setAccentVars(generatePalette(accentHex.value, dark))
    }
  }

  function toggleDark() {
    isDark.value = !isDark.value
    _apply(isDark.value)
  }

  /** Set active accent colour (called by ModuleView on mount/change). */
  function setAccent(hex) {
    if (!hex) { clearAccent(); return }
    accentHex.value = hex
    setAccentVars(generatePalette(hex, isDark.value))
  }

  /** Remove the accent override: CSS fallback to --color-primary kicks in. */
  function clearAccent() {
    accentHex.value = null
    clearAccentVars()
  }

  /**
   * Compute a palette for any hex in the current mode.
   * Reactive: any template/computed that calls this will re-render on mode change
   * because it reads isDark.value.
   */
  function paletteFor(hex) {
    return generatePalette(hex || '#3B82F6', isDark.value)
  }

  // Apply on store creation (runs on first import, before any component mounts)
  _apply(isDark.value)

  return { isDark, accentHex, toggleDark, setAccent, clearAccent, paletteFor }
})
