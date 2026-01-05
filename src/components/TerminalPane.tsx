import { Component, Show } from "solid-js"
import type { RunningApp, ThemeConfig } from "../types"
import { formatLeaderKeybind } from "../lib/keybinds"

export interface TerminalPaneProps {
  runningApp: RunningApp | undefined
  isFocused: boolean
  width: number
  height: number
  theme: ThemeConfig
  leaderKey: string
  newTabBinding: string
  onInput?: (data: string) => void
}

export const TerminalPane: Component<TerminalPaneProps> = (props) => {
  const contentWidth = () => Math.max(1, props.width - 2)
  const contentHeight = () => Math.max(1, props.height - 3)

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
              No app selected. Press {formatLeaderKeybind(props.leaderKey, props.newTabBinding)} to add one.
            </text>
          </box>
        }
      >
        {(app) => (
          <box flexDirection="column" flexGrow={1}>
            {/* Terminal header */}
            <box height={1} flexDirection="row">
              <text fg={props.theme.accent}>
                <b>{app().entry.name}</b>
              </text>
              <text fg={props.theme.muted}>
                {" "}({app().status})
              </text>
            </box>

            {/* Terminal content */}
            <box width={contentWidth()} height={contentHeight()} overflow="hidden">
              <ghostty-terminal
                ansi={app().buffer}
                cols={contentWidth()}
                rows={contentHeight()}
                showCursor
                style={{ width: contentWidth(), height: contentHeight() }}
              />
            </box>
          </box>
        )}
      </Show>
    </box>
  )
}
