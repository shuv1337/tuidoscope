import { Component, createSignal, createMemo, createEffect, For, onMount } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import type { ThemeConfig } from "../../types"
import type { ListRow } from "./types"
import { APP_PRESETS, CATEGORY_TAB_LABELS } from "./presets"
import { buildFilteredRows, getPresetIndices } from "./presetFilter"
import { commandExists } from "../../lib/command"

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

// Category order for tab navigation
const CATEGORY_ORDER = ["all", "shell", "productivity", "monitor", "files", "git", "dev", "editor", "ai", "utility"] as const

export const PresetSelectionStep: Component<PresetSelectionStepProps> = (props) => {
  const [focusedIndex, setFocusedIndex] = createSignal(0)
  
  // State for vim-style "gg" (go to top) key sequence detection.
  // When user presses 'g', we set pendingG=true and wait for the next key.
  // If next key is also 'g', we jump to top. Otherwise, reset and process normally.
  const [pendingG, setPendingG] = createSignal(false)
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = createSignal("")
  const [isSearchFocused, setIsSearchFocused] = createSignal(false)
  const [activeCategory, setActiveCategory] = createSignal<string>("all")
  
  // Track which preset commands are available on the system
  const [availability, setAvailability] = createSignal<Record<string, boolean>>({})
  
  // Build a filtered list of rows (headers + presets) based on category and search query
  const filteredRows = createMemo<ListRow[]>(() => 
    buildFilteredRows(APP_PRESETS, activeCategory(), searchQuery())
  )
  
  // Get only the preset row indices for navigation (skip headers)
  const presetIndices = createMemo(() => getPresetIndices(filteredRows()))
  
  // Reset focus to first item when filtered results change
  createEffect(() => {
    // Access filteredRows to create dependency
    filteredRows()
    setFocusedIndex(0)
  })
  
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
    
    // ==========================================
    // SEARCH MODE - handles input when search is focused
    // ==========================================
    if (isSearchFocused()) {
      // Enter: exit search mode (keep query)
      if (event.name === "return" || event.name === "enter") {
        setIsSearchFocused(false)
        event.preventDefault()
        return
      }
      
      // Escape: blur search (query persists, Esc chain handles clearing later)
      if (event.name === "escape") {
        setIsSearchFocused(false)
        event.preventDefault()
        return
      }
      
      // Backspace: delete last char from query (not go back)
      if (event.name === "backspace") {
        setSearchQuery((prev) => prev.slice(0, -1))
        event.preventDefault()
        return
      }
      
      // Arrow keys: navigate results (even in search mode)
      // No-op when results are empty
      if (event.name === "down") {
        if (indices.length > 0) {
          setFocusedIndex((prev) => Math.min(prev + 1, maxNavIndex))
        }
        event.preventDefault()
        return
      }
      if (event.name === "up") {
        if (indices.length > 0) {
          setFocusedIndex((prev) => Math.max(prev - 1, 0))
        }
        event.preventDefault()
        return
      }
      
      // Printable characters (including j, k, space): append to query
      // event.sequence contains the actual character for printable keys
      if (event.sequence && event.sequence.length === 1) {
        const char = event.sequence
        // Check if it's a printable character (space through tilde in ASCII)
        if (char >= " " && char <= "~") {
          setSearchQuery((prev) => prev + char)
          event.preventDefault()
          return
        }
      }
      
      return // Swallow other keys in search mode
    }
    
    // ==========================================
    // NAVIGATION MODE - normal list navigation
    // ==========================================
    
    // ESC priority chain (only when not in search mode)
    if (event.name === "escape") {
      if (searchQuery()) {
        // (2) Clear query and reset focus
        setSearchQuery("")
        setFocusedIndex(0)
        event.preventDefault()
        return
      }
      // (3) No search state, go back
      props.onBack()
      event.preventDefault()
      return
    }
    
    // Backspace: go back (only in navigation mode)
    if (event.name === "backspace") {
      props.onBack()
      event.preventDefault()
      return
    }
    
    // "/" enters search mode
    if (event.sequence === "/") {
      setIsSearchFocused(true)
      event.preventDefault()
      return
    }
    
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

    // Navigate down - no-op when results are empty
    if (event.name === "j" || event.name === "down") {
      if (indices.length > 0) {
        setFocusedIndex((prev) => Math.min(prev + 1, maxNavIndex))
      }
      event.preventDefault()
      return
    }

    // Navigate up - no-op when results are empty
    if (event.name === "k" || event.name === "up") {
      if (indices.length > 0) {
        setFocusedIndex((prev) => Math.max(prev - 1, 0))
      }
      event.preventDefault()
      return
    }

    // Toggle selection - no-op when results are empty
    if (event.name === "space") {
      if (indices.length === 0) {
        event.preventDefault()
        return
      }
      const rowIndex = indices[focusedIndex()]
      const row = filteredRows()[rowIndex]
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
  })

  return (
    // aria-label="Select preset applications" role="region"
    <box
      width="100%"
      height="100%"
      flexDirection="column"
      justifyContent="flex-start"
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

      {/* Category tabs row */}
      <box height={1}>
        <For each={CATEGORY_ORDER}>
          {(cat) => {
            const isActive = () => activeCategory() === cat
            const label = CATEGORY_TAB_LABELS[cat] || cat
            return (
              <text
                fg={isActive() 
                  ? cat === "all" 
                    ? props.theme.foreground 
                    : props.theme.accent
                  : props.theme.muted}
              >
                {isActive() && cat === "all" ? `[${label}]` : label}
                {" "}
              </text>
            )
          }}
        </For>
      </box>

      {/* Search input row */}
      {isSearchFocused() ? (
        <box height={1}>
          <text bg={props.theme.primary} fg={props.theme.background}>
            {" Search: "}
          </text>
          <text fg={props.theme.foreground}>
            {searchQuery()}█
          </text>
        </box>
      ) : searchQuery() ? (
        <box height={1}>
          <text fg={props.theme.muted}>
            Filter: {searchQuery()}
          </text>
        </box>
      ) : (
        <box height={1} />
      )}

      {/* role="listbox" aria-multiselectable="true" aria-label="Available preset applications" - Preset list */}
      <box flexDirection="column" alignItems="flex-start" flexGrow={1} overflow="hidden">
        {presetIndices().length === 0 ? (
          // Empty results message - centered
          <box height={1} width="100%" justifyContent="center">
            <text fg={props.theme.muted}>
              No matching apps
            </text>
          </box>
        ) : (
          <For each={filteredRows()}>
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
        )}
      </box>

      {/* role="status" aria-live="polite" aria-atomic="true" - Selected count */}
      <box height={1}>
        <text fg={props.theme.foreground}>
          {props.selectedPresets.size} app{props.selectedPresets.size !== 1 ? "s" : ""} selected
        </text>
      </box>

      {/* role="note" aria-label="Keyboard shortcuts" - Footer keybind hints */}
      <box height={1}>
        <text fg={props.theme.primary}>
          {isSearchFocused() 
            ? "Enter: Done | Esc: Cancel | ↑/↓: Navigate"
            : "j/k: Navigate | /: Search | Space: Toggle | Enter: Next | Esc: Back"
          }
        </text>
      </box>
    </box>
  )
}
