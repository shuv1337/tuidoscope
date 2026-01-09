import { Component, For, Show, createEffect, createMemo, createSignal } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import type { ThemeConfig } from "../types"
import { THEME_PRESETS, getCurrentThemeId, type ThemePreset } from "../lib/themes"
import { DialogBox } from "./DialogBox"

export interface ThemePickerProps {
  theme: ThemeConfig
  onSelect: (themeId: string) => void
  onClose: () => void
}

function matchesThemeQuery(query: string, theme: ThemePreset): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return theme.name.toLowerCase().includes(q) || theme.id.toLowerCase().includes(q)
}

export const ThemePicker: Component<ThemePickerProps> = (props) => {
  const [query, setQuery] = createSignal("")
  const [selectedIndex, setSelectedIndex] = createSignal(0)

  const DIALOG_HEIGHT = 14
  const HEADER_HEIGHT = 3
  const FOOTER_HEIGHT = 3
  const BORDER_HEIGHT = 2
  const VISIBLE_THEMES = DIALOG_HEIGHT - BORDER_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT

  const filteredThemes = createMemo(() => {
    return THEME_PRESETS.filter((theme) => matchesThemeQuery(query(), theme))
  })

  const currentThemeId = createMemo(() => getCurrentThemeId(props.theme))

  const scrollOffset = createMemo(() => {
    const idx = selectedIndex()
    const themes = filteredThemes()
    if (themes.length <= VISIBLE_THEMES) return 0
    const maxOffset = themes.length - VISIBLE_THEMES
    const centered = Math.floor(VISIBLE_THEMES / 2)
    return Math.min(Math.max(idx - centered, 0), maxOffset)
  })

  const handleSelect = (theme: ThemePreset | undefined) => {
    if (!theme) return
    props.onSelect(theme.id)
    props.onClose()
  }

  useKeyboard((event) => {
    if (event.name === "escape") {
      props.onClose()
      event.preventDefault()
      return
    }

    if (event.name === "up" || event.name === "k") {
      if (filteredThemes().length === 0) {
        return
      }
      setSelectedIndex((current) => Math.max(0, current - 1))
      event.preventDefault()
      return
    }

    if (event.name === "down" || event.name === "j") {
      const total = filteredThemes().length
      if (total === 0) {
        return
      }
      setSelectedIndex((current) => Math.min(total - 1, current + 1))
      event.preventDefault()
      return
    }
  })

  createEffect(() => {
    filteredThemes()
    setSelectedIndex(0)
  })

  return (
    <DialogBox theme={props.theme} top="25%" left="25%" width="50%" height={DIALOG_HEIGHT}>
      {/* Search input */}
      <box
        height={3}
        flexDirection="row"
        borderStyle="single"
        borderColor={props.theme.muted}
        paddingLeft={1}
        paddingRight={1}
      >
        <box height={1} flexDirection="row" flexGrow={1}>
          <text fg={props.theme.muted}>{"> "}</text>
          <input
            height={1}
            flexGrow={1}
            value={query()}
            focused
            backgroundColor={props.theme.background}
            textColor={props.theme.foreground}
            focusedBackgroundColor={props.theme.background}
            focusedTextColor={props.theme.foreground}
            placeholder="Filter themes..."
            placeholderColor={props.theme.muted}
            cursorColor={props.theme.accent}
            onInput={(value) => setQuery(value)}
            onSubmit={() => handleSelect(filteredThemes()[selectedIndex()])}
          />
        </box>
      </box>

      {/* Theme list */}
      <box flexDirection="column" flexGrow={1} overflow="hidden">
        <Show
          when={filteredThemes().length > 0}
          fallback={
            <box flexGrow={1} justifyContent="center" alignItems="center">
              <text fg={props.theme.muted}>No matching themes.</text>
            </box>
          }
        >
          <For each={filteredThemes().slice(scrollOffset(), scrollOffset() + VISIBLE_THEMES)}>
            {(theme, index) => {
              const actualIndex = () => scrollOffset() + index()
              const isSelected = () => actualIndex() === selectedIndex()
              const isCurrent = () => theme.id === currentThemeId()
              return (
                <box height={1} flexDirection="row">
                  <text
                    fg={
                      isSelected()
                        ? props.theme.background
                        : isCurrent()
                          ? props.theme.accent
                          : props.theme.foreground
                    }
                    bg={isSelected() ? props.theme.primary : undefined}
                  >
                    {isCurrent() ? " [*] " : " [ ] "}
                    {theme.name.padEnd(18)}
                    {theme.id}
                  </text>
                </box>
              )
            }}
          </For>
        </Show>
      </box>

      {/* Footer hints */}
      <box
        height={3}
        borderStyle="single"
        borderColor={props.theme.muted}
        paddingLeft={1}
        paddingRight={1}
      >
        <box height={1}>
          <text fg={props.theme.muted}>
            Enter:Select | Esc:Close | Up/Down:Navigate | j/k:Navigate
          </text>
        </box>
      </box>
    </DialogBox>
  )
}
