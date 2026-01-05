import type { KeyEvent } from "@opentui/core"

/**
 * Convert a KeyEvent to a keybind string representation.
 * For example: { ctrl: true, name: "a" } -> "ctrl+a"
 */
export function eventToKeybindString(event: KeyEvent): string {
  const parts: string[] = []
  
  if (event.ctrl) parts.push("ctrl")
  if (event.option) parts.push("alt")
  if (event.shift) parts.push("shift")
  if (event.meta) parts.push("meta")
  
  // Normalize key name
  let keyName = event.name.toLowerCase()
  
  // Handle special cases
  if (keyName === "return") keyName = "enter"
  if (keyName === " ") keyName = "space"
  
  parts.push(keyName)
  
  return parts.join("+")
}

/**
 * Validate if a keybind string is suitable for use as a leader key.
 * A valid leader key must:
 * - Have at least one modifier (ctrl, alt, meta)
 * - Not be Enter, Escape, or Tab (reserved for navigation)
 * - Not be a single letter without modifiers
 */
export function isValidLeaderKey(keybind: string): boolean {
  const parts = keybind.toLowerCase().split("+")
  const key = parts[parts.length - 1]
  
  // Check for required modifiers
  const hasCtrl = parts.includes("ctrl")
  const hasAlt = parts.includes("alt")
  const hasMeta = parts.includes("meta") || parts.includes("cmd")
  const hasModifier = hasCtrl || hasAlt || hasMeta
  
  // Reject keys without modifiers
  if (!hasModifier) {
    return false
  }
  
  // Reject reserved navigation keys
  const reservedKeys = ["enter", "return", "escape", "tab", "backspace"]
  if (reservedKeys.includes(key)) {
    return false
  }
  
  return true
}

/**
 * Re-export leaderKeyToSequence for convenience.
 * The actual implementation is in keybinds.ts to avoid circular dependencies.
 */
export { leaderKeyToSequence } from "./keybinds"
