import type { KeyEvent } from "@opentui/core"
import type { LeaderBindings } from "../types"

export type KeybindAction =
  | "next_tab"
  | "prev_tab"
  | "close_tab"
  | "new_tab"
  | "toggle_focus"
  | "edit_app"
  | "restart_app"
  | "command_palette"
  | "stop_app"
  | "kill_all"
  | "quit"

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
 * Check if an event matches the leader key (e.g., "ctrl+a")
 */
export function matchesLeaderKey(event: KeyEvent, leaderKey: string): boolean {
  return matchesKeybind(event, leaderKey)
}

/**
 * Check if an event matches a single key (no modifiers required).
 * Used for leader bindings where the modifier context is already established.
 * 
 * Handles special cases:
 * - "space" matches space key
 * - "enter" matches enter/return key
 * - "K" (uppercase) matches shift+k
 */
export function matchesSingleKey(event: KeyEvent, key: string): boolean {
  const eventName = event.name.toLowerCase()
  const keyLower = key.toLowerCase()
  
  // Handle special keys
  if (keyLower === "space") {
    return eventName === "space" || eventName === " " || event.sequence === " "
  }
  
  if (keyLower === "enter") {
    return eventName === "return" || eventName === "enter"
  }
  
  // Handle uppercase letters (shift+letter)
  if (key.length === 1 && key === key.toUpperCase() && key !== key.toLowerCase()) {
    // Uppercase letter like "K" requires shift+k
    return eventName === keyLower && event.shift === true
  }
  
  // Regular single key match (no modifiers)
  return eventName === keyLower && !event.ctrl && !event.shift && !event.meta && !(event.option ?? false)
}

/**
 * Format a leader keybind for display (e.g., "ctrl+a" + "n" -> "^A+n")
 */
export function formatLeaderKeybind(leaderKey: string, binding: string): string {
  const leaderFormatted = formatLeaderKey(leaderKey)
  return `${leaderFormatted}+${binding}`
}

/**
 * Format a leader key for display (e.g., "ctrl+a" -> "^A")
 */
export function formatLeaderKey(leaderKey: string): string {
  const parsed = parseKeybind(leaderKey)
  
  if (parsed.ctrl && parsed.key.length === 1) {
    return `^${parsed.key.toUpperCase()}`
  }
  
  // Fallback for non-ctrl leader keys
  const parts: string[] = []
  if (parsed.ctrl) parts.push("^")
  if (parsed.alt) parts.push("Alt+")
  if (parsed.meta) parts.push("Cmd+")
  if (parsed.shift) parts.push("Shift+")
  parts.push(parsed.key.toUpperCase())
  
  return parts.join("")
}

/**
 * Create a leader binding handler that maps single keys to actions.
 * Returns the action name if matched, null otherwise.
 */
export function createLeaderBindingHandler(
  bindings: LeaderBindings,
  handlers: Partial<Record<KeybindAction, () => void>>
): (event: KeyEvent) => KeybindAction | null {
  const bindingMap: Record<string, KeybindAction> = {
    [bindings.next_tab]: "next_tab",
    [bindings.prev_tab]: "prev_tab",
    [bindings.close_tab]: "close_tab",
    [bindings.new_tab]: "new_tab",
    [bindings.toggle_focus]: "toggle_focus",
    [bindings.edit_app]: "edit_app",
    [bindings.restart_app]: "restart_app",
    [bindings.command_palette]: "command_palette",
    [bindings.stop_app]: "stop_app",
    [bindings.kill_all]: "kill_all",
    [bindings.quit]: "quit",
  }

  return (event: KeyEvent): KeybindAction | null => {
    for (const [binding, action] of Object.entries(bindingMap)) {
      if (matchesSingleKey(event, binding)) {
        const handler = handlers[action]
        if (handler) {
          handler()
        }
        return action
      }
    }
    return null
  }
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

/**
 * Convert a leader key string to its PTY sequence for double-tap passthrough.
 * For example, "ctrl+a" returns "\x01" (ASCII 1, Ctrl+A).
 * Returns null if the leader key cannot be converted to a sequence.
 */
export function leaderKeyToSequence(leaderKey: string): string | null {
  const parsed = parseKeybind(leaderKey)
  
  // ctrl+letter produces ASCII code = letter - 96 (a=1, b=2, etc.)
  if (parsed.ctrl && parsed.key.length === 1 && parsed.key >= "a" && parsed.key <= "z") {
    return String.fromCharCode(parsed.key.charCodeAt(0) - 96)
  }
  
  // Cannot determine sequence for non-ctrl keys
  return null
}
