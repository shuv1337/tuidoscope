// Configuration types
export interface ThemeConfig {
  primary: string
  background: string
  foreground: string
  accent: string
  muted: string
}

export interface AppEntryConfig {
  id?: string
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
  layout: LayoutMode
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

export type LayoutMode = "classic" | "zellij"

export type PaneId = string
export type WindowId = string

export type PaneSplitDirection = "horizontal" | "vertical"

export type PaneLayoutNode =
  | { type: "leaf"; paneId: PaneId }
  | { type: "split"; direction: PaneSplitDirection; children: [PaneLayoutNode, PaneLayoutNode] }

export interface RunningApp {
  entry: AppEntry
  status: AppStatus
  buffer: string
  runId: number
}

export interface RunningPane {
  paneId: PaneId
  entry: AppEntry
  status: AppStatus
  buffer: string
  runId: number
}

export interface WindowState {
  id: WindowId
  title: string
  layout: PaneLayoutNode
  activePaneId: PaneId
}

export interface SessionData {
  runningApps: Array<string | SessionAppRef>
  activeTab: string | SessionAppRef | null
  windows?: SessionWindowData[]
  panes?: SessionPaneData[]
  activeWindowId?: string | null
  activePaneId?: string | null
  timestamp: number
}

export interface SessionAppRef {
  id: string
  name: string
  command: string
  args?: string
  cwd: string
}

export interface SessionPaneData {
  paneId: PaneId
  entry: SessionAppRef
}

export interface SessionWindowData {
  id: WindowId
  title: string
  layout: PaneLayoutNode
  activePaneId: PaneId
}

export type FocusMode = "tabs" | "terminal"
