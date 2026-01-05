import { Component, For, Show } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import type { ThemeConfig, AppEntryConfig } from "../../types"
import { APP_PRESETS } from "./presets"
import { formatLeaderKeybind } from "../../lib/keybinds"

/**
 * ConfirmationStep - Final review step of the onboarding wizard
 *
 * Accessibility annotations for future screen reader support:
 * - role="region" aria-label="Review setup configuration"
 * - The title should be aria-level="1" role="heading"
 * - Summary line should be role="status" aria-live="polite" aria-atomic="true"
 * - Preset apps section:
 *   - Section header should be aria-level="2" role="heading"
 *   - List should be role="list" aria-label="Selected preset applications"
 *   - Each item should be role="listitem" aria-label="[app name] ([command])"
 * - Custom apps section:
 *   - Section header should be aria-level="2" role="heading"
 *   - List should be role="list" aria-label="Custom applications"
 *   - Each item should be role="listitem" aria-label="[app name] ([command])"
 * - No apps message should be role="status" aria-live="polite"
 * - Config location note should be role="note"
 * - Keybind hints should be role="note" aria-label="Keyboard shortcuts"
 * - Enter key action: aria-label="Confirm and save configuration"
 * - Escape key action: aria-label="Go back to previous step"
 */

export interface ConfirmationStepProps {
  theme: ThemeConfig
  selectedPresets: Set<string>
  customApps: AppEntryConfig[]
  selectedLeaderKey: string
  newTabBinding: string
  onConfirm: () => void
  onBack: () => void
}

export const ConfirmationStep: Component<ConfirmationStepProps> = (props) => {
  useKeyboard((event) => {
    // Confirm and complete wizard
    if (event.name === "return" || event.name === "enter") {
      props.onConfirm()
      event.preventDefault()
      return
    }

    // Go back
    if (event.name === "escape" || event.name === "backspace") {
      props.onBack()
      event.preventDefault()
      return
    }
  })

  const totalApps = () => props.selectedPresets.size + props.customApps.length

  const selectedPresetApps = () =>
    APP_PRESETS.filter((preset) => props.selectedPresets.has(preset.id))

  return (
    // aria-label="Review setup configuration" role="region"
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
          <b>Review Your Setup</b>
        </text>
      </box>

      {/* Spacer */}
      <box height={1} />

      {/* role="status" aria-live="polite" aria-atomic="true" - Summary line */}
      <box height={1}>
        <text fg={props.theme.foreground}>
          You're adding {totalApps()} app{totalApps() !== 1 ? "s" : ""}:
        </text>
      </box>

      {/* Spacer */}
      <box height={1} />

      {/* Preset apps section */}
      <Show when={props.selectedPresets.size > 0}>
        <box flexDirection="column" alignItems="flex-start">
          {/* aria-level="2" role="heading" */}
          <box height={1}>
            <text fg={props.theme.muted}>From presets:</text>
          </box>
          {/* role="list" aria-label="Selected preset applications" */}
          <For each={selectedPresetApps()}>
            {(preset) => (
              // role="listitem" aria-label="{preset.name} ({preset.command})"
              <box height={1}>
                <text fg={props.theme.foreground}>
                  {"  "}{preset.icon} {preset.name}
                </text>
                <text fg={props.theme.muted}> ({preset.command})</text>
              </box>
            )}
          </For>
        </box>
        <box height={1} />
      </Show>

      {/* Custom apps section */}
      <Show when={props.customApps.length > 0}>
        <box flexDirection="column" alignItems="flex-start">
          {/* aria-level="2" role="heading" */}
          <box height={1}>
            <text fg={props.theme.muted}>Custom apps:</text>
          </box>
          {/* role="list" aria-label="Custom applications" */}
          <For each={props.customApps}>
            {(app) => (
              // role="listitem" aria-label="{app.name} ({app.command})"
              <box height={1}>
                <text fg={props.theme.foreground}>
                  {"  "}{app.name}
                </text>
                <text fg={props.theme.muted}> ({app.command})</text>
              </box>
            )}
          </For>
        </box>
        <box height={1} />
      </Show>

      {/* role="status" aria-live="polite" - No apps message */}
      <Show when={totalApps() === 0}>
        <box height={1}>
          <text fg={props.theme.muted}>
            No apps selected. Add more apps later with {formatLeaderKeybind(props.selectedLeaderKey, props.newTabBinding)}
          </text>
        </box>
        <box height={1} />
      </Show>

      {/* role="note" - Config location note */}
      <box height={1}>
        <text fg={props.theme.muted}>
          Config will be saved to: ~/.config/tuidoscope/tuidoscope.yaml
        </text>
      </box>

      {/* Spacer */}
      <box height={2} />

      {/* role="note" aria-label="Keyboard shortcuts" - Footer keybind hints */}
      <box height={1}>
        <text fg={props.theme.primary}>
          Enter: Confirm & Save | Esc/Backspace: Back
        </text>
      </box>
    </box>
  )
}
