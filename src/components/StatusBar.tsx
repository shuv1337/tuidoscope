import { Component, Show } from "solid-js"
import type { FocusMode, LayoutMode, ThemeConfig } from "../types"

export interface StatusBarProps {
  appName: string | null
  appStatus: string | null
  focusMode: FocusMode
  message: string | null
  theme: ThemeConfig
  layoutMode?: LayoutMode
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
        <Show
          when={props.focusMode === "tabs"}
          fallback={
            <text fg={props.theme.foreground}>
              {props.layoutMode === "zellij" ? " Ctrl+A:Switch to Manager" : " Ctrl+A:Switch to Tabs"}
            </text>
          }
        >
          <Show
            when={props.layoutMode === "zellij"}
            fallback={
              <text fg={props.theme.foreground}>
                {" j/k:Nav  gg/G:Jump  Enter:Select  Space:Palette  t:New  e:Edit  x:Stop  r:Restart  K:KillAll  q:Detach  Q:Quit  Ctrl+A:Terminal"}
              </text>
            }
          >
            <text fg={props.theme.foreground}>
              {" v:SplitV  s:SplitH  n:NewWin  x:ClosePane  w:CloseWin  [:PrevWin  ]:NextWin  p:NextPane  Space:Palette  Ctrl+A:Terminal"}
            </text>
          </Show>
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
          {props.focusMode === "terminal"
            ? "[TERMINAL]"
            : props.layoutMode === "zellij"
              ? "[MANAGER]"
              : "[TABS]"}
          {" "}
        </text>
      </box>
    </box>
  )
}
