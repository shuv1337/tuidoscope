import { Component, For, createSignal, createMemo, createEffect } from "solid-js"
import type { AppEntry, ThemeConfig } from "../types"
import { createAppSearch, highlightMatch } from "../lib/fuzzy"

export interface CommandPaletteProps {
  entries: AppEntry[]
  theme: ThemeConfig
  onSelect: (entry: AppEntry, action: "switch" | "start" | "stop" | "restart") => void
  onClose: () => void
}

export const CommandPalette: Component<CommandPaletteProps> = (props) => {
  const [query, setQuery] = createSignal("")
  const [selectedIndex, setSelectedIndex] = createSignal(0)

  const search = createMemo(() => createAppSearch(props.entries))

  const results = createMemo(() => {
    return search().search(query())
  })

  // Reset selection when results change
  createEffect(() => {
    results()
    setSelectedIndex(0)
  })

  return (
    <box
      position="absolute"
      top="20%"
      left="20%"
      width="60%"
      height="60%"
      flexDirection="column"
      borderStyle="double"
      borderColor={props.theme.primary}
      backgroundColor={props.theme.background}
    >
      {/* Search input */}
      <box height={1} borderStyle="single" borderColor={props.theme.muted}>
        <text fg={props.theme.accent}>{">"} </text>
        <text fg={props.theme.foreground}>{query()}</text>
        <text fg={props.theme.accent}>█</text>
      </box>

      {/* Results list */}
      <box flexDirection="column" flexGrow={1} overflow="hidden">
        <For each={results().slice(0, 10)}>
          {(result, index) => (
            <box
              height={1}
              backgroundColor={index() === selectedIndex() ? props.theme.primary : undefined}
              onMouseDown={() => props.onSelect(result.item, "switch")}
            >
              <text
                fg={index() === selectedIndex() ? props.theme.background : props.theme.foreground}
              >
                {" "}{highlightMatch(result.item.name, query())}
              </text>
              <text fg={props.theme.muted}>
                {" - "}{result.item.command}
              </text>
            </box>
          )}
        </For>
      </box>

      {/* Footer hints */}
      <box height={1} borderStyle="single" borderColor={props.theme.muted}>
        <text fg={props.theme.muted}>
          Enter:Select | Esc:Close | ↑↓:Navigate
        </text>
      </box>
    </box>
  )
}
