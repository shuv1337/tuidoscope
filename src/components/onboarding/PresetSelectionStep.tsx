import { Component, createSignal, createMemo, For, onMount } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import type { ThemeConfig } from "../../types"
import { APP_PRESETS, CATEGORY_LABELS } from "./presets"
import { commandExists } from "../../lib/command"

/** A row in the preset list - either a category header or a preset item */
type ListRow = 
  | { type: "header"; category: string; label: string }
  | { type: "preset"; preset: typeof APP_PRESETS[number]; originalIndex: number }

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
  
  // State for vim-style "gg" (go to top) key sequence detection.
  // When user presses 'g', we set pendingG=true and wait for the next key.
  // If next key is also 'g', we jump to top. Otherwise, reset and process normally.
  const [pendingG, setPendingG] = createSignal(false)
  
  // Track which preset commands are available on the system
  const [availability, setAvailability] = createSignal<Record<string, boolean>>({})
  
  // Build a flat list of rows (headers + presets) for rendering with category grouping
  const listRows = createMemo<ListRow[]>(() => {
    const rows: ListRow[] = []
    let currentCategory: string | undefined
    
    APP_PRESETS.forEach((preset, originalIndex) => {
      // Insert category header when category changes
      if (preset.category && preset.category !== currentCategory) {
        currentCategory = preset.category
        const label = CATEGORY_LABELS[preset.category] || preset.category
        rows.push({ type: "header", category: preset.category, label })
      }
      rows.push({ type: "preset", preset, originalIndex })
    })
    
    return rows
  })
  
  // Get only the preset rows for navigation (skip headers)
  const presetIndices = createMemo(() => 
    listRows()
      .map((row, idx) => row.type === "preset" ? idx : -1)
      .filter(idx => idx !== -1)
  )
  
  // Check availability of all preset commands on mount
  onMount(async () => {
    const results: Record<string, boolean> = {}
    await Promise.all(
      APP_PRESETS.map(async (preset) => {
        results[preset.id] = await commandExists(preset.command)
      })
    )
    setAvailability(results)
  })
  
  // Helper to check if a preset command is available (defaults to true before check completes)
  const isAvailable = (id: string) => availability()[id] ?? true

  useKeyboard((event) => {
    const indices = presetIndices()
    const maxNavIndex = indices.length - 1
    
    // Complete the "gg" sequence: if we're waiting for second 'g' and got it, jump to top
    if (pendingG()) {
      setPendingG(false)
      if (event.sequence === "g") {
        setFocusedIndex(0)
        event.preventDefault()
        return
      }
      // Not a 'g', fall through to process this key normally
    }

    // Start "gg" sequence: first 'g' pressed, wait for potential second 'g'
    if (event.sequence === "g") {
      setPendingG(true)
      event.preventDefault()
      return
    }

    // G (shift+g) for vim-style jump to bottom (last item)
    if (event.sequence === "G") {
      setFocusedIndex(maxNavIndex)
      event.preventDefault()
      return
    }

    // Navigate down
    if (event.name === "j" || event.name === "down") {
      setFocusedIndex((prev) => Math.min(prev + 1, maxNavIndex))
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
      const rowIndex = indices[focusedIndex()]
      const row = listRows()[rowIndex]
      if (row?.type === "preset") {
        props.onTogglePreset(row.preset.id)
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
        <For each={listRows()}>
          {(row, rowIndex) => {
            // Category header row
            if (row.type === "header") {
              return (
                <box height={1}>
                  <text fg={props.theme.accent}>
                    <b>── {row.label} ──</b>
                  </text>
                </box>
              )
            }
            
            // Preset item row
            const preset = row.preset
            // Find this preset's position in the navigation order
            const navIndex = () => presetIndices().indexOf(rowIndex())
            const isFocused = () => focusedIndex() === navIndex()
            const isSelected = () => props.selectedPresets.has(preset.id)
            const available = () => isAvailable(preset.id)

            return (
              // role="option" aria-selected={isSelected} aria-label="{preset.name} - {preset.description}"
              // aria-posinset={index+1} aria-setsize={APP_PRESETS.length}
              <box height={1}>
                {/* Focus indicator - visible focus for accessibility */}
                <text
                  fg={isFocused() ? props.theme.accent : props.theme.muted}
                  bg={isFocused() ? props.theme.primary : props.theme.background}
                >
                  {isFocused() ? "> " : "  "}
                </text>
                {/* aria-checked={isSelected} - checkbox state with unicode indicators */}
                <text
                  fg={isFocused() 
                    ? props.theme.background 
                    : isSelected() 
                      ? "#22c55e"
                      : props.theme.muted}
                  bg={isFocused() ? props.theme.primary : props.theme.background}
                >
                  {isSelected() ? "[✓]" : "[ ]"}
                </text>
                <text
                  fg={isFocused() 
                    ? props.theme.background 
                    : available() 
                      ? props.theme.foreground 
                      : props.theme.muted}
                  bg={isFocused() ? props.theme.primary : props.theme.background}
                >
                  {" "}{preset.icon} {preset.name}
                </text>
                <text
                  fg={isFocused() ? props.theme.background : props.theme.muted}
                  bg={isFocused() ? props.theme.primary : props.theme.background}
                >
                  {" "}- {preset.description}{!available() ? " (not installed)" : ""}
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
