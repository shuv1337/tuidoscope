import { Component } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import type { ThemeConfig } from "../../types"

/**
 * WelcomeStep - First step of the onboarding wizard
 *
 * Accessibility annotations for future screen reader support:
 * - role="region" aria-label="Welcome screen"
 * - The title should be aria-level="1" (heading)
 * - Feature list should be role="list" with role="listitem" children
 * - Keybind hints should be role="status" aria-live="polite"
 * - Enter key should trigger aria-label="Get started with setup"
 * - Escape key should trigger aria-label="Skip onboarding wizard"
 */

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

    if (event.name === "escape" || event.name === "backspace") {
      props.onSkip()
      event.preventDefault()
      return
    }
  })

  return (
    // aria-label="Welcome screen" role="region"
    <box
      width="100%"
      height="100%"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      {/* aria-level="1" role="heading" - Title */}
      <box height={1}>
        <text fg={props.theme.accent}>
          <b>Welcome to tuidoscope</b>
        </text>
      </box>

      {/* aria-describedby for title - Subtitle */}
      <box height={1}>
        <text fg={props.theme.foreground}>
          A terminal multiplexer for TUI applications
        </text>
      </box>

      {/* Spacer */}
      <box height={2} />

      {/* role="list" aria-label="Features" - Feature list */}
      <box flexDirection="column" alignItems="flex-start">
        {/* role="listitem" */}
        <box height={1}>
          <text fg={props.theme.muted}>  - Run multiple TUI apps side-by-side</text>
        </box>
        {/* role="listitem" */}
        <box height={1}>
          <text fg={props.theme.muted}>  - Quick-switch between applications</text>
        </box>
        {/* role="listitem" */}
        <box height={1}>
          <text fg={props.theme.muted}>  - Persistent sessions across restarts</text>
        </box>
        {/* role="listitem" */}
        <box height={1}>
          <text fg={props.theme.muted}>  - Fully configurable via YAML</text>
        </box>
      </box>

      {/* Spacer */}
      <box height={2} />

      {/* role="status" aria-live="polite" - Footer keybind hints */}
      <box height={1}>
        <text fg={props.theme.primary}>
          Enter: Get Started | Esc/Backspace: Skip
        </text>
      </box>
    </box>
  )
}
