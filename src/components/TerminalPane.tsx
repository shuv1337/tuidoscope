import { Component, Show } from "solid-js"
import type { RunningApp, ThemeConfig } from "../types"

export interface TerminalPaneProps {
  runningApp: RunningApp | undefined
  isFocused: boolean
  width: number
  height: number
  theme: ThemeConfig
  onInput?: (data: string) => void
}

export const TerminalPane: Component<TerminalPaneProps> = (props) => {
  return (
    <box
      flexDirection="column"
      flexGrow={1}
      height={props.height}
      borderStyle="single"
      borderColor={props.isFocused ? props.theme.primary : props.theme.muted}
    >
      <Show
        when={props.runningApp}
        fallback={
          <box flexGrow={1} justifyContent="center" alignItems="center">
            <text fg={props.theme.muted}>
              No app selected. Press Ctrl+T to add one.
            </text>
          </box>
        }
      >
        {(app) => (
          <box flexDirection="column" flexGrow={1}>
            {/* Terminal header */}
            <box height={1}>
              <text fg={props.theme.accent}>
                <b>{app().entry.name}</b>
              </text>
              <text fg={props.theme.muted}>
                {" "}({app().status})
              </text>
            </box>

            {/* Terminal content - will be replaced with GhosttyTerminalRenderable */}
            <box flexGrow={1} overflow="hidden">
              <text fg={props.theme.foreground}>
                {app().buffer.slice(-5000)}
              </text>
            </box>
          </box>
        )}
      </Show>
    </box>
  )
}
