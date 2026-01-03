import { Component, For, Show } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import type { ThemeConfig, AppEntryConfig } from "../../types"
import { APP_PRESETS } from "./presets"

export interface ConfirmationStepProps {
  theme: ThemeConfig
  selectedPresets: Set<string>
  customApps: AppEntryConfig[]
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
          <b>Review Your Setup</b>
        </text>
      </box>

      {/* Spacer */}
      <box height={1} />

      {/* Summary line */}
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
          <box height={1}>
            <text fg={props.theme.muted}>From presets:</text>
          </box>
          <For each={selectedPresetApps()}>
            {(preset) => (
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
          <box height={1}>
            <text fg={props.theme.muted}>Custom apps:</text>
          </box>
          <For each={props.customApps}>
            {(app) => (
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

      {/* No apps message */}
      <Show when={totalApps() === 0}>
        <box height={1}>
          <text fg={props.theme.muted}>
            No apps selected. You can add apps later with Ctrl+T
          </text>
        </box>
        <box height={1} />
      </Show>

      {/* Config location note */}
      <box height={1}>
        <text fg={props.theme.muted}>
          Config will be saved to: ~/.config/tuidoscope/tuidoscope.yaml
        </text>
      </box>

      {/* Spacer */}
      <box height={2} />

      {/* Footer keybind hints */}
      <box height={1}>
        <text fg={props.theme.primary}>
          Enter: Confirm & Save | Esc/Backspace: Back
        </text>
      </box>
    </box>
  )
}
