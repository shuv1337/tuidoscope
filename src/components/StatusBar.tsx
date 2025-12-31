import { Component, Show } from "solid-js"
import type { ThemeConfig, FocusMode } from "../types"
import { formatKeybind } from "../lib/keybinds"

export interface StatusBarProps {
  appName: string | null
  appStatus: string | null
  focusMode: FocusMode
  message: string | null
  theme: ThemeConfig
  keybinds: {
    toggle_focus: string
    command_palette: string
    stop_app: string
    kill_all: string
    quit: string
  }
}

export const StatusBar: Component<StatusBarProps> = (props) => {
  return (
    <box
      height={1}
      flexDirection="row"
      backgroundColor={props.theme.muted}
    >
      {/* Left: keybind hints */}
      <box flexGrow={1}>
        <text fg={props.theme.foreground}>
          {" "}
          {formatKeybind(props.keybinds.toggle_focus)}:Focus
          {" | "}
          {formatKeybind(props.keybinds.command_palette)}:Palette
          {" | "}
          {formatKeybind(props.keybinds.stop_app)}:Stop
          {" | "}
          {formatKeybind(props.keybinds.kill_all)}:KillAll
          {" | "}
          {formatKeybind(props.keybinds.quit)}:Quit
        </text>
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
