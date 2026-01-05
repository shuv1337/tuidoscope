import { Component, createSignal, For } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import type { KeybindingStepProps } from "./types"
import { LEADER_PRESETS, type LeaderPreset } from "./keybindingPresets"
import { eventToKeybindString, isValidLeaderKey } from "../../lib/key-capture"

/**
 * KeybindingStep - Leader key selection step of the onboarding wizard
 *
 * Accessibility annotations for future screen reader support:
 * - role="region" aria-label="Choose leader key"
 * - The title should be aria-level="1" role="heading"
 * - Preset list should be role="listbox" aria-activedescendant
 * - Each preset should be role="option" with:
 *   - aria-selected="true/false" based on selection state
 *   - aria-label="[preset name] - [description]"
 * - j/k navigation: aria-label="Move to next/previous option"
 * - Enter/Space action: aria-label="Select this leader key"
 */

export const KeybindingStep: Component<KeybindingStepProps> = (props) => {
  const [focusedIndex, setFocusedIndex] = createSignal(0)
  const [isCapturing, setIsCapturing] = createSignal(false)
  const [capturedKey, setCapturedKey] = createSignal("")
  const [showHelp, setShowHelp] = createSignal(false)

  // Find current selected index based on selectedLeaderKey
  const getSelectedIndex = () => {
    const idx = LEADER_PRESETS.findIndex((p) => p.key === props.selectedLeaderKey)
    // If not found or custom key, select custom option
    return idx === -1 ? LEADER_PRESETS.length - 1 : idx
  }

  const isSelected = (preset: LeaderPreset) => {
    if (preset.id === "custom") {
      // Custom is selected if the key doesn't match any preset
      return !LEADER_PRESETS.slice(0, -1).some((p) => p.key === props.selectedLeaderKey)
    }
    return preset.key === props.selectedLeaderKey
  }

  useKeyboard((event) => {
    // Capture mode: capture any key with modifiers
    if (isCapturing()) {
      // Escape cancels capture
      if (event.name === "escape") {
        setIsCapturing(false)
        setCapturedKey("")
        event.preventDefault()
        return
      }

      // Enter confirms captured key
      if (event.name === "return" || event.name === "enter") {
        if (capturedKey() && isValidLeaderKey(capturedKey())) {
          props.onSelectLeader(capturedKey())
          setIsCapturing(false)
          setCapturedKey("")
        }
        event.preventDefault()
        return
      }

      // Capture any key with at least one modifier
      if (event.ctrl || event.option || event.meta) {
        const keybind = eventToKeybindString(event)
        if (isValidLeaderKey(keybind)) {
          setCapturedKey(keybind)
        }
        event.preventDefault()
        return
      }

      // Ignore other keys during capture
      event.preventDefault()
      return
    }

    // Normal navigation mode
    const maxIndex = LEADER_PRESETS.length - 1

    // Navigate down
    if (event.name === "j" || event.name === "down") {
      setFocusedIndex((prev) => Math.min(prev + 1, maxIndex))
      event.preventDefault()
      return
    }

    // Navigate up
    if (event.name === "k" || event.name === "up") {
      setFocusedIndex((prev) => Math.max(prev - 1, 0))
      event.preventDefault()
      return
    }

    // Select preset
    if (event.name === "return" || event.name === "enter" || event.name === "space") {
      const preset = LEADER_PRESETS[focusedIndex()]
      if (preset.id === "custom") {
        // Enter capture mode for custom key
        setIsCapturing(true)
        setCapturedKey("")
      } else {
        // Select this preset and continue
        props.onSelectLeader(preset.key)
        if (event.name === "return" || event.name === "enter") {
          props.onNext()
        }
      }
      event.preventDefault()
      return
    }

    // Toggle help tooltip
    if (event.name === "?" || (event.shift && event.name === "/")) {
      setShowHelp((prev) => !prev)
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
    // aria-label="Choose leader key" role="region"
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
          <b>Choose Your Leader Key</b>
        </text>
      </box>

      {/* Explanation */}
      <box height={1}>
        <text fg={props.theme.foreground}>
          The leader key activates tuidoscope commands
        </text>
      </box>

      {/* Spacer */}
      <box height={1} />

      {/* Example */}
      <box height={1}>
        <text fg={props.theme.muted}>
          Example: Leader + n = next tab, Leader + q = quit
        </text>
      </box>

      {/* Spacer */}
      <box height={1} />

      {/* Capture mode overlay */}
      {isCapturing() ? (
        <box flexDirection="column" alignItems="center">
          <box height={1}>
            <text fg={props.theme.accent}>
              <b>Press the key combination you want to use...</b>
            </text>
          </box>
          <box height={1} />
          <box height={1}>
            <text fg={props.theme.foreground}>
              Detected: <b>{capturedKey() || "(waiting...)"}</b>
            </text>
          </box>
          <box height={1} />
          <box height={1}>
            <text fg={props.theme.muted}>
              {capturedKey() && isValidLeaderKey(capturedKey())
                ? "Press Enter to confirm, Escape to cancel"
                : "Press a key with Ctrl, Alt, or Cmd modifier"}
            </text>
          </box>
        </box>
      ) : (
        <>
          {/* role="listbox" - Preset list */}
          <box flexDirection="column" alignItems="flex-start">
            <For each={LEADER_PRESETS}>
              {(preset, index) => {
                const isFocused = () => focusedIndex() === index()
                const selected = () => isSelected(preset)

                return (
                  // role="option" aria-selected={selected}
                  <box height={1}>
                    {/* Focus indicator */}
                    <text
                      fg={isFocused() ? props.theme.accent : props.theme.muted}
                      bg={isFocused() ? props.theme.primary : props.theme.background}
                    >
                      {isFocused() ? "> " : "  "}
                    </text>
                    {/* Selection indicator */}
                    <text
                      fg={
                        isFocused()
                          ? props.theme.background
                          : selected()
                          ? "#22c55e"
                          : props.theme.muted
                      }
                      bg={isFocused() ? props.theme.primary : props.theme.background}
                    >
                      {selected() ? "(*)" : "( )"}
                    </text>
                    {/* Preset name */}
                    <text
                      fg={isFocused() ? props.theme.background : props.theme.foreground}
                      bg={isFocused() ? props.theme.primary : props.theme.background}
                    >
                      {" "}{preset.name}
                    </text>
                    {/* Description */}
                    <text
                      fg={isFocused() ? props.theme.background : props.theme.muted}
                      bg={isFocused() ? props.theme.primary : props.theme.background}
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

          {/* Help tooltip panel */}
          {showHelp() && (() => {
            const preset = LEADER_PRESETS[focusedIndex()]
            const tooltip = preset?.tooltip
            return (
              <box flexDirection="column" alignItems="flex-start">
                <box height={1}>
                  <text fg={props.theme.muted}>Origin: </text>
                  <text fg={props.theme.foreground}>{tooltip?.origin ?? "N/A"}</text>
                </box>
                <box height={1}>
                  <text fg={props.theme.muted}>Example: </text>
                  <text fg={props.theme.foreground}>{tooltip?.example ?? "N/A"}</text>
                </box>
                {tooltip?.conflicts && tooltip.conflicts.length > 0 && (
                  <>
                    <box height={1}>
                      <text fg={props.theme.muted}>Conflicts:</text>
                    </box>
                    {tooltip.conflicts.map((conflict) => (
                      <box height={1}>
                        <text fg={props.theme.foreground}>  • {conflict}</text>
                      </box>
                    ))}
                  </>
                )}
                <box height={1} />
              </box>
            )
          })()}

          {/* Tip about conflicts - only show when help is not visible */}
          {!showHelp() && (
            <box height={1}>
              <text fg={props.theme.muted}>
                Tip: Choose a key that doesn't conflict with your terminal
              </text>
            </box>
          )}

          {/* Spacer */}
          <box height={1} />

          {/* Footer keybind hints */}
          <box height={1}>
            <text fg={props.theme.primary}>
              j/k: Navigate | Enter: Select | ?: Help | Esc/Backspace: Back
            </text>
          </box>
        </>
      )}
    </box>
  )
}
