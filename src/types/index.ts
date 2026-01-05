import type { PtyProcess } from "../lib/pty"

// Configuration types
export interface ThemeConfig {
  primary: string
  background: string
  foreground: string
  accent: string
  muted: string
}

/** V1 keybind config (legacy format, used for migration to V2) */
export interface KeybindConfigV1 {
  next_tab: string
  prev_tab: string
  close_tab: string
  new_tab: string
  toggle_focus: string
  edit_app: string
  restart_app: string
  command_palette: string
  stop_app: string
  kill_all: string
  quit: string
}

/** Leader key configuration for V2 keybind system */
export interface LeaderConfig {
  key: string
  timeout: number
  show_hints: boolean
  hint_delay: number
}

/** Single-key bindings that follow the leader key activation */
export interface LeaderBindings {
  next_tab: string
  prev_tab: string
  close_tab: string
  new_tab: string
  toggle_focus: string
  edit_app: string
  restart_app: string
  command_palette: string
  stop_app: string
  kill_all: string
  quit: string
}

/** Direct bindings that work without leader key (in tabs focus mode) */
export interface DirectBindings {
  navigate_up: string
  navigate_down: string
  select: string
  go_top: string
  go_bottom: string
}

/** V2 keybind config with tmux-style leader key support */
export interface KeybindConfigV2 {
  leader: LeaderConfig
  bindings: LeaderBindings
  direct: DirectBindings
}

/** Union type for keybind config (supports both V1 and V2 for migration) */
export type KeybindConfig = KeybindConfigV1 | KeybindConfigV2

/**
 * Type guard to check if a keybind config is V2 format.
 * V2 configs have leader, bindings, and direct properties.
 */
export function isV2KeybindConfig(config: KeybindConfig): config is KeybindConfigV2 {
  return 'leader' in config && 'bindings' in config && 'direct' in config
}

export interface AppEntryConfig {
  name: string
  command: string
  args?: string
  cwd: string
  autostart?: boolean
  restart_on_exit?: boolean
  env?: Record<string, string>
}

export interface SessionConfig {
  persist: boolean
  file?: string  // Optional, uses XDG_STATE_HOME/tuidoscope/session.yaml by default
}

export interface Config {
  version: number
  theme: ThemeConfig
  keybinds: KeybindConfigV2  // Always V2 after migration
  tab_width: number
  apps: AppEntryConfig[]
  session: SessionConfig
}

// Runtime types
export interface AppEntry {
  id: string
  name: string
  command: string
  args?: string
  cwd: string
  env?: Record<string, string>
  autostart: boolean
  restartOnExit: boolean
}

export type AppStatus = "stopped" | "running" | "error"

export interface RunningApp {
  entry: AppEntry
  pty: PtyProcess
  status: AppStatus
  buffer: string
}

export interface SessionData {
  runningApps: string[]
  activeTab: string | null
  timestamp: number
}

export type FocusMode = "tabs" | "terminal"
