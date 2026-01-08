import type { KeyEvent } from "@opentui/core"

interface ParsedKeybind {
  key: string
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
}

/**
 * Parse a keybind string like "ctrl+p" into components
 */
export function parseKeybind(keybind: string): ParsedKeybind {
  const parts = keybind.toLowerCase().split("+")
  const key = parts[parts.length - 1]

  return {
    key,
    ctrl: parts.includes("ctrl"),
    alt: parts.includes("alt"),
    shift: parts.includes("shift"),
    meta: parts.includes("meta") || parts.includes("cmd"),
  }
}

/**
 * Check if an opentui KeyEvent matches a keybind string (with modifiers like "ctrl+a")
 */
export function matchesKeybind(event: KeyEvent, keybind: string): boolean {
  const parsed = parseKeybind(keybind)

  // opentui uses 'option' for alt on Mac, we check both
  const eventAlt = event.option ?? false
  const eventName = event.name.toLowerCase()
  const isSpaceKey = parsed.key === "space"
  const eventIsSpace =
    eventName === "space" || eventName === " " || event.sequence === " " || event.sequence === "\x00"
  const ctrlSequence =
    parsed.ctrl && parsed.key.length === 1 && parsed.key >= "a" && parsed.key <= "z"
      ? String.fromCharCode(parsed.key.charCodeAt(0) - 96)
      : null
  const ctrlSequenceMatch = !!ctrlSequence && event.sequence === ctrlSequence
  const keyMatches = isSpaceKey ? eventIsSpace : eventName === parsed.key || ctrlSequenceMatch
  const ctrlMatches = parsed.ctrl ? (event.ctrl || ctrlSequenceMatch) : !event.ctrl

  return (
    keyMatches &&
    ctrlMatches &&
    eventAlt === parsed.alt &&
    event.shift === parsed.shift &&
    event.meta === parsed.meta
  )
}

/**
 * Format a keybind for display (e.g., "ctrl+p" -> "Ctrl+P")
 */
export function formatKeybind(keybind: string): string {
  return keybind
    .split("+")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("+")
}
