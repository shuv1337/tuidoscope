import { Component, Show } from "solid-js"
import type { ThemeConfig, FocusMode } from "../types"

export interface StatusBarProps {
  appName: string | null
  appStatus: string | null
  focusMode: FocusMode
  message: string | null
  theme: ThemeConfig
}

export const StatusBar: Component<StatusBarProps> = (props) => {
  return (
    <box
      height={1}
      flexDirection="row"
      backgroundColor={props.theme.muted}
    >
      {/* Left: keybind hints based on focus mode */}
      <box flexGrow={1}>
        <Show when={props.focusMode === "tabs"} fallback={
          <text fg={props.theme.foreground}>
            {" Ctrl+A:Switch to Tabs"}
          </text>
        }>
          <text fg={props.theme.foreground}>
            {" j/k:Nav  gg/G:Jump  Enter:Select  Space:Palette  t:New  e:Edit  x:Stop  r:Restart  K:KillAll  q:Detach  Q:Quit  Ctrl+A:Terminal"}
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
