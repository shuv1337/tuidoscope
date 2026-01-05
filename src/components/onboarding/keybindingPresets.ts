/**
 * Leader key preset options for onboarding wizard.
 * These presets provide common key combinations that work well as leader keys.
 */

export interface LeaderPreset {
  id: string
  key: string
  name: string
  description: string
}

export const LEADER_PRESETS: LeaderPreset[] = [
  {
    id: "tmux",
    key: "ctrl+a",
    name: "Ctrl+A",
    description: "tmux-style (recommended)",
  },
  {
    id: "tmux-alt",
    key: "ctrl+b",
    name: "Ctrl+B",
    description: "tmux alternate",
  },
  {
    id: "screen",
    key: "ctrl+\\",
    name: "Ctrl+\\",
    description: "GNU Screen style",
  },
  {
    id: "desktop",
    key: "alt+space",
    name: "Alt+Space",
    description: "Desktop-style",
  },
  {
    id: "custom",
    key: "",
    name: "Custom...",
    description: "Choose your own",
  },
]
