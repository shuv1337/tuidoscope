import type { KeyEvent } from "@opentui/core"
import type { KeybindConfig } from "../types"

export type KeybindAction =
  | "next_tab"
  | "prev_tab"
  | "close_tab"
  | "new_tab"
  | "toggle_focus"
  | "rename_tab"
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
 * Check if an opentui KeyEvent matches a keybind string
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
 * Create a keybind handler that maps events to actions
 */
export function createKeybindHandler(
  config: KeybindConfig,
  handlers: Partial<Record<KeybindAction, () => void>>
) {
  const keybindMap: Record<string, KeybindAction> = {
    [config.next_tab]: "next_tab",
    [config.prev_tab]: "prev_tab",
    [config.close_tab]: "close_tab",
    [config.new_tab]: "new_tab",
    [config.toggle_focus]: "toggle_focus",
    [config.rename_tab]: "rename_tab",
    [config.restart_app]: "restart_app",
    [config.command_palette]: "command_palette",
    [config.stop_app]: "stop_app",
    [config.kill_all]: "kill_all",
    [config.quit]: "quit",
  }

  return (event: KeyEvent): boolean => {
    for (const [keybind, action] of Object.entries(keybindMap)) {
      if (matchesKeybind(event, keybind)) {
        const handler = handlers[action]
        if (handler) {
          handler()
          return true
        }
      }
    }
    return false
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
