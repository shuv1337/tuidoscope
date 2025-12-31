import { Component, For, createSignal, createMemo, createEffect } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import type { AppEntry, ThemeConfig } from "../types"
import { createAppSearch } from "../lib/fuzzy"
import { buildEntryCommand } from "../lib/command"

export interface CommandPaletteProps {
  entries: AppEntry[]
  theme: ThemeConfig
  onSelect: (entry: AppEntry, action: "switch" | "start" | "stop" | "restart" | "edit") => void
  onClose: () => void
}

export const CommandPalette: Component<CommandPaletteProps> = (props) => {
  const [query, setQuery] = createSignal("")
  const [selectedIndex, setSelectedIndex] = createSignal(0)

  const search = createMemo(() => createAppSearch(props.entries))

  const results = createMemo(() => {
    return search().search(query())
  })

  useKeyboard((event) => {
    if (event.name === "escape") {
      props.onClose()
      event.preventDefault()
      return
    }

    if (event.name === "return" || event.name === "enter") {
      const selected = results()[selectedIndex()]
      if (selected) {
        props.onSelect(selected.item, "switch")
      }
      event.preventDefault()
      return
    }

    if (event.name === "x") {
      const selected = results()[selectedIndex()]
      if (selected) {
        props.onSelect(selected.item, "stop")
      }
      event.preventDefault()
      return
    }

    if ((event.ctrl && event.name === "e") || event.sequence === "\u0005") {
      const selected = results()[selectedIndex()]
      if (selected) {
        props.onSelect(selected.item, "edit")
      }
      event.preventDefault()
      return
    }

    if (event.name === "up" || event.name === "k") {
      setSelectedIndex((current) => Math.max(0, current - 1))
      event.preventDefault()
      return
    }

    if (event.name === "down" || event.name === "j") {
      setSelectedIndex((current) => Math.min(results().length - 1, current + 1))
      event.preventDefault()
      return
    }

    if (event.name === "backspace") {
      setQuery((current) => current.slice(0, -1))
      event.preventDefault()
      return
    }

    if (!event.ctrl && !event.meta && !event.option && event.sequence && event.sequence.length === 1) {
      setQuery((current) => current + event.sequence)
      event.preventDefault()
    }
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
      <box
        height={1}
        flexDirection="row"
        borderStyle="single"
        borderColor={props.theme.muted}
      >
        <text fg={props.theme.foreground}>{`> ${query()}█`}</text>
      </box>

      {/* Results list */}
      <box flexDirection="column" flexGrow={1} overflow="hidden">
        <For each={results().slice(0, 10)}>
          {(result, index) => (
            <box
              height={1}
              width="100%"
              flexDirection="row"
              backgroundColor={index() === selectedIndex() ? props.theme.primary : props.theme.background}
              onMouseDown={() => props.onSelect(result.item, "switch")}
            >
              <text
                width="100%"
                fg={index() === selectedIndex() ? props.theme.background : props.theme.foreground}
                bg={index() === selectedIndex() ? props.theme.primary : props.theme.background}
              >
                {" "}{`${result.item.name} - ${buildEntryCommand(result.item)}`}
              </text>
            </box>
          )}
        </For>
      </box>

      {/* Footer hints */}
      <box height={1} borderStyle="single" borderColor={props.theme.muted}>
        <text fg={props.theme.muted}>
          Enter:Select | x:Stop | Ctrl+E:Edit | Esc:Close | ↑↓:Navigate
        </text>
      </box>
    </box>
  )
}
