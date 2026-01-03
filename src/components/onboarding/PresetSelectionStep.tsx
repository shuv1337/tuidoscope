import { Component, createSignal, For } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import type { ThemeConfig } from "../../types"
import { APP_PRESETS } from "./presets"

/**
 * PresetSelectionStep - App preset selection step of the onboarding wizard
 *
 * Accessibility annotations for future screen reader support:
 * - role="region" aria-label="Select preset applications"
 * - The title should be aria-level="1" role="heading"
 * - Preset list should be role="listbox" aria-multiselectable="true"
 * - Each preset should be role="option" with:
 *   - aria-selected="true/false" based on selection state
 *   - aria-label="[preset name] - [description]"
 *   - aria-posinset and aria-setsize for position info
 * - Focused item should have aria-activedescendant pointing to current option
 * - Selection count should be role="status" aria-live="polite" aria-atomic="true"
 * - Keybind hints should be role="note" for screen reader description
 * - Space key action: aria-label="Toggle selection"
 * - j/k navigation: aria-label="Move to next/previous option"
 * - gg/G navigation: aria-label="Jump to first/last option"
 */

export interface PresetSelectionStepProps {
  theme: ThemeConfig
  selectedPresets: Set<string>
  onTogglePreset: (presetId: string) => void
  onNext: () => void
  onBack: () => void
}

export const PresetSelectionStep: Component<PresetSelectionStepProps> = (props) => {
  const [focusedIndex, setFocusedIndex] = createSignal(0)
  const [pendingG, setPendingG] = createSignal(false)

  useKeyboard((event) => {
    // Handle gg sequence for jump to top
    if (pendingG()) {
      setPendingG(false)
      if (event.sequence === "g") {
        setFocusedIndex(0)
        event.preventDefault()
        return
      }
    }

    // First g in gg sequence
    if (event.sequence === "g") {
      setPendingG(true)
      event.preventDefault()
      return
    }

    // G (shift+g) for jump to bottom
    if (event.sequence === "G") {
      setFocusedIndex(APP_PRESETS.length - 1)
      event.preventDefault()
      return
    }

    // Navigate down
    if (event.name === "j" || event.name === "down") {
      setFocusedIndex((prev) => Math.min(prev + 1, APP_PRESETS.length - 1))
      event.preventDefault()
      return
    }

    // Navigate up
    if (event.name === "k" || event.name === "up") {
      setFocusedIndex((prev) => Math.max(prev - 1, 0))
      event.preventDefault()
      return
    }

    // Toggle selection
    if (event.name === "space") {
      const preset = APP_PRESETS[focusedIndex()]
      if (preset) {
        props.onTogglePreset(preset.id)
      }
      event.preventDefault()
      return
    }

    // Next step
    if (event.name === "return" || event.name === "enter") {
      props.onNext()
      event.preventDefault()
      return
    }

    // Back
    if (event.name === "escape" || event.name === "backspace") {
      props.onBack()
      event.preventDefault()
      return
    }
  })

  return (
    // aria-label="Select preset applications" role="region"
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
          <b>Select Apps to Add</b>
        </text>
      </box>

      {/* role="note" - Instruction */}
      <box height={1}>
        <text fg={props.theme.muted}>
          Space to select, Enter to continue
        </text>
      </box>

      {/* Spacer */}
      <box height={1} />

      {/* role="listbox" aria-multiselectable="true" aria-label="Available preset applications" - Preset list */}
      <box flexDirection="column" alignItems="flex-start">
        <For each={APP_PRESETS}>
          {(preset, index) => {
            const isFocused = () => focusedIndex() === index()
            const isSelected = () => props.selectedPresets.has(preset.id)

            return (
              // role="option" aria-selected={isSelected} aria-label="{preset.name} - {preset.description}"
              // aria-posinset={index+1} aria-setsize={APP_PRESETS.length}
              <box height={1}>
                {/* Focus indicator - visible focus for accessibility */}
                <text
                  fg={isFocused() ? props.theme.accent : props.theme.muted}
                >
                  {isFocused() ? "> " : "  "}
                </text>
                {/* aria-checked={isSelected} - checkbox state */}
                <text
                  fg={isFocused() ? props.theme.background : props.theme.foreground}
                  bg={isFocused() ? props.theme.primary : undefined}
                >
                  {isSelected() ? "[x]" : "[ ]"} {preset.icon} {preset.name}
                </text>
                <text
                  fg={isFocused() ? props.theme.background : props.theme.muted}
                  bg={isFocused() ? props.theme.primary : undefined}
                >
                  {" "}- {preset.description}
                </text>
              </box>
            )
          }}
        </For>
      </box>

      {/* Spacer */}
      <box height={1} />

      {/* role="status" aria-live="polite" aria-atomic="true" - Selected count */}
      <box height={1}>
        <text fg={props.theme.foreground}>
          {props.selectedPresets.size} app{props.selectedPresets.size !== 1 ? "s" : ""} selected
        </text>
      </box>

      {/* Spacer */}
      <box height={1} />

      {/* role="note" aria-label="Keyboard shortcuts" - Footer keybind hints */}
      <box height={1}>
        <text fg={props.theme.primary}>
          j/k: Navigate | gg/G: Top/Bottom | Space: Toggle | Enter: Next | Esc/Backspace: Back
        </text>
      </box>
    </box>
  )
}
