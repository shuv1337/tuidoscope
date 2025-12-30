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
  | "quit"

export interface KeyEvent {
  key: string
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
}

/**
 * Parse a keybind string like "ctrl+p" into components
 */
export function parseKeybind(keybind: string): KeyEvent {
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
 * Check if a key event matches a keybind
 */
export function matchesKeybind(event: KeyEvent, keybind: string): boolean {
  const parsed = parseKeybind(keybind)

  return (
    event.key.toLowerCase() === parsed.key &&
    event.ctrl === parsed.ctrl &&
    event.alt === parsed.alt &&
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
