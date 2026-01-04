import { Component, Show } from "solid-js"
import type { ThemeConfig, FocusMode, LeaderConfig, LeaderBindings } from "../types"
import { formatLeaderKeybind } from "../lib/keybinds"

export interface StatusBarProps {
  appName: string | null
  appStatus: string | null
  focusMode: FocusMode
  message: string | null
  theme: ThemeConfig
  leader: LeaderConfig
  bindings: LeaderBindings
  leaderActive?: boolean
}

export const StatusBar: Component<StatusBarProps> = (props) => {
  return (
    <box
      height={1}
      flexDirection="row"
      backgroundColor={props.theme.muted}
    >
      {/* Left: leader indicator or keybind hints */}
      <box flexGrow={1}>
        <Show when={props.leaderActive} fallback={
          <text fg={props.theme.foreground}>
            {" "}
            {formatLeaderKeybind(props.leader.key, props.bindings.toggle_focus)}:Focus
            {" | "}
            {formatLeaderKeybind(props.leader.key, props.bindings.command_palette)}:Palette
            {" | "}
            {formatLeaderKeybind(props.leader.key, props.bindings.edit_app)}:Edit
            {" | "}
            {formatLeaderKeybind(props.leader.key, props.bindings.stop_app)}:Stop
            {" | "}
            {formatLeaderKeybind(props.leader.key, props.bindings.kill_all)}:KillAll
            {" | "}
            {formatLeaderKeybind(props.leader.key, props.bindings.quit)}:Quit
          </text>
        }>
          <text fg={props.theme.accent}>
            <b> [{formatLeaderKey(props.leader.key)}...] Waiting for key...</b>
          </text>
        </Show>
      </box>

      {/* Center: message or app info */}
      <box>
        <Show when={props.message} fallback={
          <Show when={props.appName}>
            <text fg={props.theme.accent}>
              {props.appName}
              {props.appStatus ? ` (${props.appStatus})` : ""}
            </text>
          </Show>
        }>
          <text fg={props.theme.accent}>
            <b>{props.message}</b>
          </text>
        </Show>
      </box>

      {/* Right: focus mode indicator */}
      <box>
        <text fg={props.theme.foreground}>
          {props.focusMode === "terminal" ? "[TERMINAL]" : "[TABS]"}
          {" "}
        </text>
      </box>
    </box>
  )
}

/**
 * Format leader key for display (e.g., "ctrl+a" -> "^A")
 */
function formatLeaderKey(leaderKey: string): string {
  const parts = leaderKey.toLowerCase().split("+")
  const key = parts[parts.length - 1]
  const hasCtrl = parts.includes("ctrl")
  
  if (hasCtrl && key.length === 1) {
    return `^${key.toUpperCase()}`
  }
  
  return leaderKey.toUpperCase()
}
