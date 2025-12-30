import type { ThemeConfig } from "../types"

// Default Tokyo Night-inspired theme
export const defaultTheme: ThemeConfig = {
  primary: "#7aa2f7",
  background: "#1a1b26",
  foreground: "#c0caf5",
  accent: "#bb9af7",
  muted: "#565f89",
}

/**
 * Parse a hex color to RGB components
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return null

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}

/**
 * Create ANSI escape code for a hex color (foreground)
 */
export function hexToAnsiFg(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return ""
  return `\x1b[38;2;${rgb.r};${rgb.g};${rgb.b}m`
}

/**
 * Create ANSI escape code for a hex color (background)
 */
export function hexToAnsiBg(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return ""
  return `\x1b[48;2;${rgb.r};${rgb.g};${rgb.b}m`
}

/**
 * Reset ANSI styling
 */
export const ansiReset = "\x1b[0m"

/**
 * Apply theme colors to text
 */
export function styled(text: string, fg?: string, bg?: string): string {
  let result = ""
  if (fg) result += hexToAnsiFg(fg)
  if (bg) result += hexToAnsiBg(bg)
  result += text
  result += ansiReset
  return result
}
