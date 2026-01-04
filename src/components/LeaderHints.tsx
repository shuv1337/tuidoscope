import { Component, For } from "solid-js"
import type { ThemeConfig, LeaderBindings } from "../types"

export interface LeaderHintsProps {
  bindings: LeaderBindings
  leaderKey: string
  theme: ThemeConfig
}

/**
 * Popup overlay showing available bindings after leader key activation.
 * Displays bindings in a 2-column grid format.
 */
export const LeaderHints: Component<LeaderHintsProps> = (props) => {
  // Define binding labels for display
  const bindingLabels: Array<{ key: keyof LeaderBindings; label: string }> = [
    { key: "next_tab", label: "Next Tab" },
    { key: "prev_tab", label: "Prev Tab" },
    { key: "new_tab", label: "New Tab" },
    { key: "close_tab", label: "Close Tab" },
    { key: "toggle_focus", label: "Focus" },
    { key: "edit_app", label: "Edit" },
    { key: "restart_app", label: "Restart" },
    { key: "command_palette", label: "Palette" },
    { key: "stop_app", label: "Stop" },
    { key: "kill_all", label: "Kill All" },
    { key: "quit", label: "Quit" },
  ]

  // Split into two columns for display
  const leftColumn = bindingLabels.slice(0, 6)
  const rightColumn = bindingLabels.slice(6)

  /**
   * Format binding key for display (e.g., "space" -> "Space", "n" -> "n")
   */
  const formatKey = (key: string): string => {
    if (key === "space") return "Space"
    if (key === "enter") return "Enter"
    return key
  }

  return (
    <box
      position="absolute"
      bottom="15%"
      left="25%"
      width="50%"
      flexDirection="column"
      borderStyle="double"
      borderColor={props.theme.primary}
      backgroundColor={props.theme.background}
    >
      {/* Header */}
      <box height={1} justifyContent="center">
        <text fg={props.theme.accent}>
          <b> Leader Key Bindings </b>
        </text>
      </box>

      {/* Two-column grid */}
      <box flexDirection="row" paddingLeft={1} paddingRight={1}>
        {/* Left column */}
        <box flexDirection="column" flexGrow={1}>
          <For each={leftColumn}>
            {(binding) => (
              <box height={1}>
                <text fg={props.theme.accent}>
                  {formatKey(props.bindings[binding.key])}
                </text>
                <text fg={props.theme.foreground}>
                  : {binding.label}
                </text>
              </box>
            )}
          </For>
        </box>

        {/* Right column */}
        <box flexDirection="column" flexGrow={1}>
          <For each={rightColumn}>
            {(binding) => (
              <box height={1}>
                <text fg={props.theme.accent}>
                  {formatKey(props.bindings[binding.key])}
                </text>
                <text fg={props.theme.foreground}>
                  : {binding.label}
                </text>
              </box>
            )}
          </For>
        </box>
      </box>

      {/* Footer */}
      <box height={1} justifyContent="center">
        <text fg={props.theme.muted}>
          Press any key...
        </text>
      </box>
    </box>
  )
}
