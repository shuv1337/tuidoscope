/**
 * Leader key preset options for onboarding wizard.
 * These presets provide common key combinations that work well as leader keys.
 */

export interface LeaderTooltip {
  origin: string
  example: string
  conflicts?: string[]
}

export interface LeaderPreset {
  id: string
  key: string
  name: string
  description: string
  tooltip?: LeaderTooltip
}

export const LEADER_PRESETS: LeaderPreset[] = [
  {
    id: "tmux",
    key: "ctrl+a",
    name: "Ctrl+A",
    description: "tmux-style (recommended)",
    tooltip: {
      origin: "Popularized by GNU Screen as the default prefix key",
      example: "Ctrl+A then N to switch to next window",
      conflicts: ["Readline: go to beginning of line", "Emacs: beginning-of-line"],
    },
  },
  {
    id: "tmux-alt",
    key: "ctrl+b",
    name: "Ctrl+B",
    description: "tmux alternate",
    tooltip: {
      origin: "Default tmux prefix key, chosen to avoid Screen's Ctrl+A",
      example: "Ctrl+B then C to create new window",
      conflicts: ["Readline: move cursor back one character", "tmux users: conflicts with existing muscle memory"],
    },
  },
  {
    id: "screen",
    key: "ctrl+\\",
    name: "Ctrl+\\",
    description: "GNU Screen style",
    tooltip: {
      origin: "Alternative Screen binding, less common but avoids readline conflicts",
      example: "Ctrl+\\ then N to switch windows",
      conflicts: ["SIGQUIT: sends quit signal to foreground process"],
    },
  },
  {
    id: "desktop",
    key: "alt+space",
    name: "Alt+Space",
    description: "Desktop-style",
    tooltip: {
      origin: "Common in desktop applications for launcher/command palettes",
      example: "Alt+Space then type command name",
      conflicts: ["GNOME: window menu", "macOS: Spotlight (if remapped)", "Windows: window system menu"],
    },
  },
  {
    id: "custom",
    key: "",
    name: "Custom...",
    description: "Choose your own",
    tooltip: {
      origin: "Define your own leader key combination",
      example: "Any key combo you prefer, e.g., Ctrl+Space",
    },
  },
]
