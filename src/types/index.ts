import type { PtyProcess } from "../lib/pty"

// Configuration types
export interface ThemeConfig {
  primary: string
  background: string
  foreground: string
  accent: string
  muted: string
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
