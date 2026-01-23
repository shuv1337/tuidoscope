import { Component, For } from "solid-js"
import type { ThemeConfig, WindowState } from "../types"

export interface WindowBarProps {
  windows: WindowState[]
  activeWindowId: string | null
  theme: ThemeConfig
  onSelect: (id: string) => void
}

export const WindowBar: Component<WindowBarProps> = (props) => {
  return (
    <box height={1} flexDirection="row" backgroundColor={props.theme.muted}>
      <For each={props.windows}>
        {(window, index) => {
          const isActive = () => window.id === props.activeWindowId
          const label = () => ` ${index() + 1}:${window.title} `
          return (
            <box onMouseDown={() => props.onSelect(window.id)}>
              <text
                fg={isActive() ? props.theme.background : props.theme.foreground}
                bg={isActive() ? props.theme.primary : props.theme.muted}
              >
                {label()}
              </text>
            </box>
          )
        }}
      </For>
    </box>
  )
}
