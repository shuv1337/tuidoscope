import { Component } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import type { ThemeConfig } from "../../types"

export interface WelcomeStepProps {
  theme: ThemeConfig
  onNext: () => void
  onSkip: () => void
}

export const WelcomeStep: Component<WelcomeStepProps> = (props) => {
  useKeyboard((event) => {
    if (event.name === "return" || event.name === "enter") {
      props.onNext()
      event.preventDefault()
      return
    }

    if (event.name === "escape") {
      props.onSkip()
      event.preventDefault()
      return
    }
  })

  return (
    <box
      width="100%"
      height="100%"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      {/* Title */}
      <box height={1}>
        <text fg={props.theme.accent}>
          <b>Welcome to tuidoscope</b>
        </text>
      </box>

      {/* Subtitle */}
      <box height={1}>
        <text fg={props.theme.foreground}>
          A terminal multiplexer for TUI applications
        </text>
      </box>

      {/* Spacer */}
      <box height={2} />

      {/* Feature list */}
      <box flexDirection="column" alignItems="flex-start">
        <box height={1}>
          <text fg={props.theme.muted}>  - Run multiple TUI apps side-by-side</text>
        </box>
        <box height={1}>
          <text fg={props.theme.muted}>  - Quick-switch between applications</text>
        </box>
        <box height={1}>
          <text fg={props.theme.muted}>  - Persistent sessions across restarts</text>
        </box>
        <box height={1}>
          <text fg={props.theme.muted}>  - Fully configurable via YAML</text>
        </box>
      </box>

      {/* Spacer */}
      <box height={2} />

      {/* Footer keybind hints */}
      <box height={1}>
        <text fg={props.theme.primary}>
          Enter: Get Started | Esc: Skip
        </text>
      </box>
    </box>
  )
}
